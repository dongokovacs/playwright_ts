# Contributing

This is a portfolio repo, but I built it the way I'd want a team's suite structured, so adding to it follows roughly the same rules a real PR review would. This is the "how do I add X" doc. [ARCHITECTURE.md](./ARCHITECTURE.md) is the "why is it built this way" one — read that first if something here doesn't make sense on its own.

## Adding a Page Object

Explore before you generate. Before writing a single locator, look at the actual rendered page instead of guessing from a description — run `npx playwright codegen <url>` (or drive the page with an MCP browser tool) and read off the real accessible roles, labels, and test-ids that exist in the DOM. This applies whether a human or an AI assistant is writing the Page Object: a locator that looks plausible but doesn't match the real DOM (wrong role name, guessed test-id, slightly-off text) is the most common way a new Page Object breaks on its first CI run, and it's avoidable for free just by checking first.

Prefer selectors in this order: `getByRole()` > `getByLabel()` > `getByPlaceholder()` > `getByText()` > `getByTestId()`. Drop to a CSS class or ARIA-role selector only when the page is third-party and has no `data-testid` to reach for — `ConduitArticlePage`'s `.article-content` and `ConduitRegisterPage`'s `.error-messages` are the existing examples of that compromise, not something to reach for by default.

One Page Object per page used in `tests/`, in `src/pages/`. Locators are `readonly Locator` fields built once in the constructor. They're lazy in Playwright, so this doesn't touch the DOM early — not the stale-element problem it'd be in Selenium. Methods are single-step, page-level actions: `fillEmail`, `selectGender`, `submit`. Not multi-step flows, see below.

`eslint.config.js` flags any `page.locator()` call inside `tests/**/*.ts`. That's not a suggestion. If a test needs a new locator, it goes on a Page Object method, not inline in the spec. No Page Object yet for that page? Add one instead of working around the rule.

`src/pages/forms.page.ts` is a good template: typed locators in the constructor, public and ready for callers to act on directly, a `goto()`, and methods only for the actions that need real logic (dynamic selectors, multi-step sequences) — not one-line wrappers around a locator that's already public. `conduit-article.page.ts` is the minimal version if a full page feels like overkill for what you're adding.

## Flow or just a Page Object?

A Page Object only knows about one page. Once you're describing a use case instead — "fill out the whole form and submit", "create an article via the API and view it in the UI" — that's a Flow. Lives in `src/flows/`, built out of one or more Page Objects (plus API clients, for hybrid flows).

Ask whether the sequence is actually reused, or whether some test wants to deliberately skip part of it. `forms.spec.ts`'s negative tests (empty submit, bad email) call `FormsPage` directly instead of going through `FormsFlow.fillValidForm()`/`submitForm()`, because they're testing what happens when you don't follow the happy path. If your new flow's only caller skips half of it, it probably isn't a flow yet.

Assertions stay in the test. A flow does things — create, navigate, delete — the test checks them. That way a failing `expect` points at the test that has it, not at some shared method three files away.

## Adding an API client + Zod schema

One client per resource in `src/api/`, built on an `ApiClient` instance. It doesn't know about HTTP plumbing — that's `request-handler.ts`'s job — and `request-handler.ts` doesn't know what any resource looks like. `tags.client.ts` is the smallest example, `articles.client.ts` the one with full CRUD.

Response shapes go in `src/api/schemas/*.schema.ts` as Zod schemas. Derive the TypeScript type with `z.infer<typeof Schema>` instead of writing it by hand, so there's one definition instead of two that can drift — that goes for request payloads too (`CreateArticlePayloadSchema`). `z.strictObject()` if unknown fields should fail validation, `z.object()` if you only care about a subset of the response. Check the schema against a real response before trusting it: `UserSchema` was strict and missing the `id` that registration returns, which went unnoticed only because nothing validated user responses yet.

Client methods pass the schema to the request — `.getRequest(200, TagsResponseSchema)` — rather than a type argument. The response is then validated and the return type derived from the schema; `getRequest<T>()`-style casts no longer exist.

Need to assert against an error status the client doesn't model yet — a 404, a 401? Don't bolt on a one-off `*ExpectingError` method unless that error is genuinely part of the resource's contract (the way `UsersClient.registerExpectingError` is, for validation errors real users hit). Otherwise just reach for the `api` fixture directly: `api.path(...).clearAuth().getRequest(404)`. `tests/api/network-resilience.spec.ts` does this. Keeps the client's surface matching what the resource actually promises, not every status code some test ever wanted to check once.

## Adding a fixture

Put it in the file for what it knows about (the full map is in ARCHITECTURE.md → Layering):

- needs a Conduit user or API client → `api.fixture.ts`
- a Conduit Page Object or a Flow mixing API + UI → `conduit.fixture.ts`
- a QA Playground Page Object/Flow, or a check run against it (a11y, performance) → `playground.fixture.ts`
- anything AI → `ai.fixture.ts`

Prefer adding to an existing file over creating a new one. `index.ts` merges them with `mergeTests()`, and specs import only from there. A genuinely new fixture file becomes a new root in that `mergeTests()` call. If a fixture needs one from another root, it has to extend that root's chain instead (the way `conduit.fixture.ts` extends `api.fixture.ts`) — separate roots can't depend on each other.

If a fixture depends on another one in the same chain — `articleFlow` needs `articlesApi` and `articlePage` — just destructure that dependency in the factory. Playwright resolves the graph; you don't order anything manually. Cleanup goes after the `await use(...)` call in the same factory. `createdArticles` in `api.fixture.ts` is the pattern: track a resource while the test runs, delete whatever's left once it's done. Fixtures are lazy, so a new one costs nothing for tests that don't ask for it.

## Adding a custom matcher

Matchers live in `src/expects/custom-expects.ts`, built on `baseExpect.extend`. Same shape every time: do the check, and on failure attach whatever context saves someone a re-run just to see what happened — API logs, axe violations, web-vitals numbers, whatever's relevant. `shouldMatchSchema` is the template.

Don't forget to extend the `Matchers<R, T>` interface at the bottom of the file with the new matcher's signature, or it won't type-check at the call site.

## Tagging

A `@tag` in the title — test-level for one-offs, `describe`-level when it covers the whole file — is what `--grep` selects on. Current ones:

- `@smoke` — a fast, broad subset for quick local runs (CI runs the full suite). Keep this list short on purpose.
- `@a11y` — accessibility checks (axe-core).
- `@perf` — Core Web Vitals budgets.
- `@resilience` — network failures, timeouts, error responses.
- `@negative` — data-driven input validation (boundary cases, bad input).
- `@ai` — tests that call a real LLM (through the `aiProvider` fixture) when `OPENROUTER_API_KEY` is set. Worth their own tag since they're the only ones with an external paid dependency and model-dependent behavior; some teams would want to exclude them from a default run, or run them on their own to watch for drift. Without a key they still run their non-AI part.

Each tag has its own `npm run test:<tag>` script. Adding a new category of test that doesn't fit an existing tag? Add the tag and the script together, not the tag now and the script "later."
