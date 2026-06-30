# Architecture & Decisions

This document explains _why_ the framework is organized the way it is, not just what's in it. If you're reviewing this as a hiring manager: this is the part that's meant to show how I think about test architecture, not just that I can write Playwright tests.

## Target systems

Two different public demo apps, chosen for what they're each good at testing:

- **[Conduit](https://conduit.bondaracademy.com/)** (a Medium-clone blog app with a real REST API — RealWorld API spec) — used for `tests/api/` and `tests/hybrid/`. It has actual CRUD resources, auth, and validation, so it's a realistic target for contract testing and API+UI flows.
- **[QA Playground](https://qaplayground.com/practice/)** — used for `tests/ui/`. Purpose-built practice components (forms, alerts, dialogs) with clean, stable markup, so the UI suite can focus on technique (locator strategy, dialog handling, self-healing) rather than fighting an unrelated app's quirks.

## Layering

```
src/
  ai/         AIProvider interface + OpenRouter implementation, assertion + data-gen helpers
  api/        fluent ApiClient, endpoint-specific clients, Zod schemas
  core/       framework-internal, dependency-free building blocks (logger, healing locator)
  expects/    custom expect matchers
  fixtures/   Playwright fixture composition (the only place tests should import from)
  pages/      Page Objects — only where the UI flow justifies one
  utils/      test data builders
```

Tests only ever import from `src/fixtures` (for `test`/`expect`) and `src/utils` or `src/api/schemas` (for data builders/types). They never reach into `src/api/request-handler.ts` or `src/core/*` directly — that's how the fixtures earn their keep.

## Key decisions

### Fixtures over `beforeEach`

Every dependency a test needs (an authenticated API client, a logged-in page, etc.) is a named fixture, composed via `test.extend`. A test that only needs `articlesApi` never pays for an auth flow it doesn't use, and the dependency graph is declared in the test signature instead of hidden in setup hooks. This is dependency injection, not a framework-specific trick — same principle as constructor injection in any OOP codebase.

### Worker-scoped auth, not `workers: 1`

`src/fixtures/auth.fixture.ts` registers one throwaway Conduit user **per worker**, not per test, so login only happens once no matter how many tests a worker picks up. The suite still runs `fullyParallel: true` — each worker gets its own isolated user, so there's no shared mutable state to serialize around. (I reviewed a similar reference project that solved the "don't log in every test" problem by setting `workers: 1` / `fullyParallel: false`, which throws away parallelism entirely. Same fixture cost, worse throughput — so that tradeoff isn't repeated here.)

### Fluent `ApiClient`

`src/api/request-handler.ts` exposes a chainable interface: `api.path('/articles').body({...}).postRequest(201)`. Each call resets its own state afterward, so nothing leaks between requests on the same client instance. Endpoint-specific clients (`UsersClient`, `ArticlesClient`, `TagsClient`) wrap it with one responsibility each — they don't know about HTTP plumbing, the `ApiClient` doesn't know about Conduit's resource shapes.

### Custom expect matchers with automatic log attachment

`shouldMatchSchema` and `shouldEqual` (`src/expects/custom-expects.ts`) attach the last 10 API request/response pairs (`src/core/logger.ts`, a ring buffer) to the failure message automatically. When a CI run fails at 3am, the failure message already contains the request that caused it — no re-running locally with extra logging just to see what was sent.

One implementation note: Playwright's `expect.extend` matcher context deliberately does **not** support Jest's `this.equals` (it throws `throwUnsupportedExpectMatcherError` by design — confirmed by reading the Playwright source after hitting the error). `shouldEqual` uses Node's `util.isDeepStrictEqual` instead.

### Schema validation with Zod, not JSON Schema/ajv

Response schemas (`src/api/schemas/*.schema.ts`) are Zod objects. `z.infer<typeof Schema>` gives the TypeScript type for free from the same definition used for runtime validation — one source of truth, no hand-maintained `.d.ts` files drifting from the actual validator.

### Self-healing locator: deterministic, not AI-based

`src/core/healing-locator.ts` takes an ordered list of locator strategies for the same element. If the primary strategy doesn't resolve in time, it falls through to the next one and **logs which strategy actually worked** (`getHealLog()`). This is a deliberate choice over an LLM-based healer:

- It's instant and free — no network round-trip in the hot path of every locator resolution.
- The healing reason is always inspectable and deterministic, not a model's best guess at a DOM snapshot.
- It's the right tool for the actual problem self-healing solves in practice: a renamed `data-testid` or swapped attribute, not "find me anything that looks clickable."

See `src/pages/forms.page.ts` for a live demo: the country-select locator's primary strategy intentionally targets a renamed (non-existent) test-id, falls back to the real one, and logs the heal event — `tests/ui/forms.spec.ts` exercises this path on every run, not just in theory.

### AI layer behind an interface

Everything in `src/ai/` talks to the `AIProvider` interface (`generateText`/`generateJson`), never to a provider's API directly. `OpenRouterProvider` is the only class that talks to OpenRouter. Swapping providers later is a new class, not a test rewrite (Dependency Inversion).

Two concrete uses:

- **`assertSemanticMatch`** (`src/ai/ai-assertion.ts`) — for asserting on text whose exact wording isn't fixed (varies by copy, locale, or generated content), where a plain string match is the wrong tool. Not used for Conduit/QA Playground's own error messages — those are stable and known, so a plain assertion is faster, free, and more precise. AI assertion is for the cases a plain one genuinely can't handle.
- **`generateTestData`** (`src/ai/test-data-generator.ts`) — turns a natural-language instruction into a JSON object, validated against a Zod schema before it's trusted. Zod stays the gate; if the model returns something that doesn't fit the schema, the test fails loudly instead of silently sending bad data to the API.

`tests/hybrid/ai-assisted-article.spec.ts` uses both: an LLM drafts an article, the API creates it, the UI renders it, and (only when `OPENROUTER_API_KEY` is configured) a semantic assertion checks the rendered body actually matches the intended topic. Without the key, the test falls back to a faker-built draft and skips just that one bonus assertion — **the test itself is never skipped**, so it still reports on every CI run regardless of whether the secret is configured for a given environment.

### Hybrid tests are real, not aspirational

`tests/hybrid/article-lifecycle.spec.ts` creates an article via the API and verifies it actually renders on the live Conduit UI, then deletes it via the API and verifies the UI reflects that too. No `test.skip`. This matters because I reviewed a similar-purpose reference repository where the only hybrid and HAR-replay tests in the codebase were `test.skip`-disabled on the main branch — i.e., the most interesting tests in the suite weren't actually running. Everything in this repo that's described as working, runs in CI on every push.

### Page Objects only where they pay for themselves

`FormsPage` exists because the form has many interdependent fields reused across four test cases. The alerts/dialogs suite (`tests/ui/alerts-dialogs.spec.ts`) doesn't get a Page Object — each scenario is a single, independent interaction, and wrapping `page.getByRole('button', { name: 'Simple Alert' }).click()` in a class would be ceremony without payoff. Same principle either way: don't add an abstraction the code doesn't need yet.

## CI/CD

- **`ci.yml`** (PR gate): lint + format check + typecheck + `@smoke`-tagged tests only (currently 7 of 20 tests, runs in well under 2 minutes). Fast enough to not be a tax on every push.
- **`nightly.yml`** (scheduled, full suite): runs everything including the AI-assisted hybrid test, with `retries: 2`. The HTML report is published to GitHub Pages via the official `actions/deploy-pages` flow. `scripts/report-flaky.js` parses the JSON reporter output and writes a flaky-test summary straight to the run's `$GITHUB_STEP_SUMMARY` — not as a comment on some arbitrary PR, since a scheduled run isn't tied to one.

## Security note

A test secret (a Google AI Studio key) was shared in plaintext during the planning conversation for this project. It was treated as compromised and never committed; `.env` is git-ignored and only `.env.example` (placeholders only) is tracked. This is also why `OPENROUTER_API_KEY` is fully optional everywhere it's used — the framework has to work for a reviewer who clones the repo and runs it with zero secrets configured.
