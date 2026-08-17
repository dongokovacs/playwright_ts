# Contributing

This is a portfolio repo, but I built it the way I'd want a team's suite structured, so adding to it follows roughly the same rules a real PR review would. This is the "how do I add X" doc. [ARCHITECTURE.md](./ARCHITECTURE.md) is the "why is it built this way" one — read that first if something here doesn't make sense on its own.

## Adding a Page Object

Explore before you generate. Before writing a single locator, look at the actual rendered page instead of guessing from a description — run `npx playwright codegen <url>` (or drive the page with an MCP browser tool) and read off the real accessible roles, labels, and test-ids that exist in the DOM. This applies whether a human or an AI assistant is writing the Page Object: a locator that looks plausible but doesn't match the real DOM (wrong role name, guessed test-id, slightly-off text) is the most common way a new Page Object breaks on its first CI run, and it's avoidable for free just by checking first.

Prefer selectors in this order: `getByRole()` > `getByLabel()` > `getByPlaceholder()` > `getByText()` > `getByTestId()`. Drop to a CSS class or ARIA-role selector only when the page is third-party and has no `data-testid` to reach for — `ConduitArticlePage`'s `.article-content` and `AlertsDialogsPage`'s `[data-sonner-toast]`/`[role="dialog"]` are the existing examples of that compromise, not something to reach for by default.

One Page Object per page used in `tests/`, in `src/pages/`. Locators are `readonly Locator` fields built once in the constructor. They're lazy in Playwright, so this doesn't touch the DOM early — not the stale-element problem it'd be in Selenium. Methods are single-step, page-level actions: `fillEmail`, `selectGender`, `submit`. Not multi-step flows, see below.

`eslint.config.js` flags any `page.locator()` call inside `tests/**/*.ts`. That's not a suggestion. If a test needs a new locator, it goes on a Page Object method, not inline in the spec. No Page Object yet for that page? Add one instead of working around the rule.

`src/pages/forms.page.ts` is a good template: typed locators in the constructor, public and ready for callers to act on directly, a `goto()`, and methods only for the actions that need real logic (dynamic selectors, multi-step sequences) — not one-line wrappers around a locator that's already public. `conduit-article.page.ts` is the minimal version if a full page feels like overkill for what you're adding.

## Flow or just a Page Object?

A Page Object only knows about one page. Once you're describing a use case instead — "fill out the whole form and submit", "create an article via the API and view it in the UI" — that's a Flow. Lives in `src/flows/`, built out of one or more Page Objects (plus API clients, for hybrid flows).

Ask whether the sequence is actually reused, or whether some test wants to deliberately skip part of it. `forms.spec.ts`'s negative tests (empty submit, bad email) call `FormsPage` directly instead of going through `FormsFlow.fillValidForm()`/`submitForm()`, because they're testing what happens when you don't follow the happy path. If your new flow's only caller skips half of it, it probably isn't a flow yet.

Assertions stay in the test. A flow does things — create, navigate, delete — the test checks them. That way a failing `expect` points at the test that has it, not at some shared method three files away.

## Adding an API client + Zod schema

One client per resource in `src/api/`, built on an `ApiClient` instance. It doesn't know about HTTP plumbing — that's `request-handler.ts`'s job — and `request-handler.ts` doesn't know what any resource looks like. `tags.client.ts` is the smallest example, `articles.client.ts` the one with full CRUD.

Response shapes go in `src/api/schemas/*.schema.ts` as Zod schemas. Derive the TypeScript type with `z.infer<typeof Schema>` instead of writing it by hand, so there's one definition instead of two that can drift. `z.strictObject()` if unknown fields should fail validation, `z.object()` if you only care about a subset of the response.

Need to assert against an error status the client doesn't model yet — a 404, a 401? Don't bolt on a one-off `*ExpectingError` method unless that error is genuinely part of the resource's contract (the way `UsersClient.registerExpectingError` is, for validation errors real users hit). Otherwise just reach for the `api` fixture directly: `api.path(...).clearAuth().getRequest(404)`. `tests/api/network-resilience.spec.ts` does this. Keeps the client's surface matching what the resource actually promises, not every status code some test ever wanted to check once.

## Adding a fixture

Two fixture chains, not one merged chain:

- `src/fixtures/api.fixture.ts` (exported via `index.ts`) — anything needing a Conduit auth token or an API client. `tests/api` and `tests/hybrid` use this.
- `src/fixtures/page.fixtures.ts` — UI-only Page Objects and Flows, no Conduit auth involved. `tests/ui` uses this.

If a fixture depends on another one in the same chain — `articleFlow` needs `articlesApi` and `articlePage` — just destructure that dependency in the factory. Playwright resolves the graph; you don't order anything manually. Cleanup goes after the `await use(...)` call in the same factory. `createdArticles` in `api.fixture.ts` is the pattern: track a resource while the test runs, delete whatever's left once it's done.

`tests/hybrid` needs both an API client and a UI Page Object in the same test. Rather than merge the two chains for that, `articlePage` just lives on the `api.fixture.ts` chain as an ordinary fixture — same shape as `articlesApi`, it just resolves to a Page Object.

## Adding a custom matcher

Matchers live in `src/expects/custom-expects.ts`, built on `baseExpect.extend`. Same shape every time: do the check, and on failure attach whatever context saves someone a re-run just to see what happened — API logs, axe violations, web-vitals numbers, whatever's relevant. `shouldMatchSchema` is the template.

Don't forget to extend the `Matchers<R, T>` interface at the bottom of the file with the new matcher's signature, or it won't type-check at the call site.

## Tagging

A `@tag` in the title — test-level for one-offs, `describe`-level when it covers the whole file — is what `--grep` selects on. Current ones:

- `@smoke` — the PR gate. Keep this list short on purpose, it's meant to be fast and broad, not exhaustive.
- `@a11y` — accessibility checks (axe-core).
- `@perf` — Core Web Vitals budgets.
- `@resilience` — network failures, timeouts, error responses.
- `@negative` — data-driven input validation (boundary cases, bad input).
- `@ai` — the test that calls a real LLM. Worth its own tag since it's the only one with an external paid dependency and non-deterministic output; some teams would want to exclude it from a default run, or run it on its own to watch for drift.

Each tag has its own `npm run test:<tag>` script. Adding a new category of test that doesn't fit an existing tag? Add the tag and the script together, not the tag now and the script "later."
