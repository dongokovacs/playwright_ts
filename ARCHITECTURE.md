# Architecture & Decisions

This is the "why" behind the framework, not a tour of what's in it. If you're a hiring manager skimming this: the code shows I can write Playwright tests, this doc is meant to show how I think about test architecture.

## Target systems

Two public demo apps, split by what they're each actually good for:

- **[Conduit](https://conduit.bondaracademy.com/)** — a Medium-clone with a real REST API (RealWorld spec). Used by `tests/api/` and `tests/hybrid/`. It has real CRUD resources, auth, and validation, so it's a fair target for contract testing.
- **[QA Playground](https://qaplayground.com/practice/)** — used by `tests/ui/`. Clean, purpose-built practice components. The point of the UI suite is locator strategy, dialog handling, self-healing — not fighting some unrelated app's quirks, so a clean target was more useful here than a "real" one.

## Layering

```
src/
  ai/         AIProvider interface + OpenRouter implementation, assertion + data-gen helpers
  api/        fluent ApiClient, endpoint-specific clients, Zod schemas
  core/       framework-internal building blocks (logger, healing locator)
  expects/    custom expect matchers
  fixtures/   Playwright fixture composition (the only place tests import from)
  pages/      Page Objects, only where the UI flow justifies one
  utils/      test data builders
```

Tests import from `src/fixtures` for `test`/`expect`, and from `src/utils` or `src/api/schemas` for data builders and types. They don't reach into `request-handler.ts` or `core/*` directly — that's the whole point of having fixtures.

There are two separate fixture chains, not one merged into the other: `index.ts` (API client + worker-scoped auth, used by `tests/api` and `tests/hybrid`) and `page.fixtures.ts` (Page Objects, used by `tests/ui`). UI tests don't need a Conduit auth token, so there's no reason to drag that fixture chain into a suite that never touches Conduit. `formsPage` is built the same way as `articlesApi` etc. — `base.extend` handing back a `new FormsPage(page)` — just in its own file instead of bolted onto the API one.

Expected page copy (error text, success messages, dialog text) lives in `fixtures/strings.ts`, not inline in the assertions. A real copy change on the site then breaks one file instead of sending you grepping through every spec that happens to assert on that string.

## Key decisions

### Fixtures over `beforeEach`

Every dependency a test needs — an authenticated API client, a logged-in page — is a named fixture composed via `test.extend`. A test that only needs `articlesApi` doesn't pay for an auth flow it isn't using, and you can see what a test depends on just by reading its signature instead of digging through setup hooks. It's dependency injection, same idea as constructor injection anywhere else.

### Worker-scoped auth, not `workers: 1`

`auth.fixture.ts` registers one throwaway Conduit user per worker, not per test. Login happens once per worker no matter how many tests it picks up, and the suite still runs fully parallel since each worker has its own isolated user — nothing to serialize around.

I looked at a similar project that solved the same "don't log in every test" problem by setting `workers: 1`, which kills parallelism entirely to get there. Same fixture savings, much worse throughput. Didn't want to repeat that.

### Fluent `ApiClient`

`request-handler.ts` is chainable: `api.path('/articles').body({...}).postRequest(201)`. Every call resets its own state afterward so nothing leaks into the next request on the same instance. The endpoint clients (`UsersClient`, `ArticlesClient`, `TagsClient`) sit on top of it, each with one job — they don't know about HTTP plumbing, and the client doesn't know what Conduit's resources look like.

### Custom expect matchers that attach logs automatically

`shouldMatchSchema` and `shouldEqual` pull in the last 10 request/response pairs (from the ring buffer in `core/logger.ts`) and attach them to the failure message. If a CI run goes red overnight, the failure already shows what was actually sent — no re-running locally just to see the request.

Small implementation note, because it cost me some time: Playwright's `expect.extend` context doesn't support Jest's `this.equals` — it throws on purpose (`throwUnsupportedExpectMatcherError`, confirmed by reading the source after hitting it). `shouldEqual` uses `util.isDeepStrictEqual` instead.

### Zod over JSON Schema/ajv

`z.infer<typeof Schema>` gives you the TypeScript type straight from the same definition that does runtime validation. One definition, not a hand-maintained `.d.ts` next to a JSON schema that can drift from it.

### Self-healing locator, deterministic on purpose

`healing-locator.ts` takes an ordered list of strategies for the same element. If the first one doesn't resolve in time, it tries the next, and logs which one actually worked (`getHealLog()`). I went with this instead of an LLM-based healer for a few reasons:

- It's instant and free — no network call sitting in the path of every locator resolution.
- The healing reason is always known and inspectable, not a model's guess at a DOM snapshot.
- It matches what self-healing actually needs to solve most of the time: a renamed `data-testid`, not "find me anything clickable."

`forms.page.ts` has a live example: the country-select locator's first strategy targets a test-id that was deliberately renamed, so it always falls through to the real one. `forms.spec.ts` exercises that path on every run, not just in a comment somewhere.

### AI behind an interface

Everything in `src/ai/` goes through `AIProvider` (`generateText`/`generateJson`), never the OpenRouter API directly. `OpenRouterProvider` is the only file that knows OpenRouter exists. Swapping providers later means adding one class, not touching tests.

Two things actually use it:

- **`assertSemanticMatch`** — for text whose exact wording isn't fixed (copy varies, locale, generated content), where a string match is the wrong tool. Conduit and QA Playground's own error messages are stable and known, so those tests just compare strings — faster and more precise. This is for the cases where that doesn't work.
- **`generateTestData`** — turns a plain-English instruction into JSON, validated against a Zod schema before it's trusted. If the model returns something that doesn't fit, the test fails loudly instead of quietly sending bad data to the API.

`tests/hybrid/ai-assisted-article.spec.ts` uses both: an LLM drafts an article, the API creates it, the UI renders it, and — only if `OPENROUTER_API_KEY` is set — a semantic check confirms the rendered text actually matches what was asked for. No key, no semantic check, but the test still runs with a faker-built draft instead. It's never skipped outright.

### Hybrid tests are real

`article-lifecycle.spec.ts` creates an article through the API, checks it actually renders on the live Conduit UI, deletes it through the API, and checks the UI reflects that too. No `test.skip` anywhere in it.

I'm calling this out specifically because I reviewed a similar-purpose repo where the hybrid and HAR-replay tests — the most interesting ones in the whole suite — were all `test.skip`'d on main. Whatever this repo claims runs, runs, in CI, on every push.

### Page Objects only where they earn it

`FormsPage` exists because that form has a lot of interdependent fields reused across four tests. `alerts-dialogs.spec.ts` doesn't get one — each scenario is one independent interaction, and wrapping `page.getByRole('button', { name: 'Simple Alert' }).click()` in a class would just be ceremony. Don't build the abstraction before the code needs it.

`FormsPage`'s locators are `readonly Locator` fields set once in the constructor, not re-queried inline in every method — the standard Playwright POM shape. Locators are lazy (they don't touch the DOM until you act on them), so building them upfront in the constructor is safe and isn't the stale-element problem it would be in Selenium.

## CI/CD

- **`smoke.yml`** — the PR gate. Lint, format check, typecheck, then just the `@smoke`-tagged tests (7 of 20 right now). Runs in well under 2 minutes, cheap enough to not annoy anyone.
- **`all.yml`** — full suite on every push/PR, plus manual dispatch. Publishes results as a GitHub check via `dorny/test-reporter` so pass/fail/skip is visible right on the commit, not buried in a log.
- **`nightly.yml`** — scheduled full run with `retries: 2`. Publishes the HTML report to GitHub Pages, and `scripts/report-flaky.js` writes any test that needed a retry into the run's step summary (not a PR comment, since a scheduled run isn't attached to one).

## Security note

A test API key got pasted into the planning conversation for this project at one point. I treated it as compromised from then on — never committed, `.env` is git-ignored, only `.env.example` (placeholders) is tracked. It's also why `OPENROUTER_API_KEY` is fully optional everywhere it's used: the framework has to work for someone who clones this and runs it with zero secrets configured.
