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
  flows/      named business use cases, composed from Page Objects (+ API clients where relevant)
  pages/      Page Objects — one per page used in tests/
  utils/      test data builders
```

Tests import from `src/fixtures` for `test`/`expect`, and from `src/utils` or `src/api/schemas` for data builders and types. They don't reach into `request-handler.ts` or `core/*` directly — that's the whole point of having fixtures.

There are two separate fixture chains, not one merged into the other: `index.ts` (API client + worker-scoped auth, used by `tests/api` and `tests/hybrid`) and `page.fixtures.ts` (Page Objects for pages that don't need Conduit auth, used by `tests/ui`). `tests/hybrid` needs both an API client and a UI Page Object in the same test, so `articlePage` (wrapping `ConduitArticlePage`) lives on the `index.ts` chain instead — it's a normal test-scoped fixture there, same shape as `articlesApi`, just resolving to a Page Object instead of an API client. `tests/api` never requests `articlePage`, so it's never instantiated there; Playwright fixtures are lazy, unused ones cost nothing.

Expected page copy (error text, success messages, dialog text) lives in `fixtures/strings.ts`, not inline in the assertions. A real copy change on the site then breaks one file instead of sending you grepping through every spec that happens to assert on that string.

## Key decisions

### Fixtures over `beforeEach`

Every dependency a test needs — an authenticated API client, a logged-in page — is a named fixture composed via `test.extend`. A test that only needs `articlesApi` doesn't pay for an auth flow it isn't using, and you can see what a test depends on just by reading its signature instead of digging through setup hooks. It's dependency injection, same idea as constructor injection anywhere else.

### Worker-scoped auth, not `workers: 1`

`auth.fixture.ts` registers one throwaway Conduit user per worker, not per test. Login happens once per worker no matter how many tests it picks up, and the suite still runs fully parallel since each worker has its own isolated user — nothing to serialize around. Setting `workers: 1` would get the same "don't log in every test" savings, but at the cost of parallelism entirely — not worth it once the per-worker fixture does the same job without that trade-off.

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

`article-lifecycle.spec.ts` creates an article through the API, checks it actually renders on the live Conduit UI, deletes it through the API, and checks the UI reflects that too. No `test.skip` anywhere in it — whatever this repo claims runs, runs, in CI, on every push.

### Test-data cleanup is tracked, not assumed

Tests that create an article call `createdArticles.track(slug)` right after (`fixtures/api.fixture.ts`). The fixture's teardown deletes anything still tracked once the test ends. Whatever error comes back from that delete gets swallowed — already deleted, never existed, doesn't matter, cleanup isn't the thing under test.

I considered just repeating an `afterEach` in every spec that creates data, but that has the same problem `try/finally` has everywhere: did you actually remember it on every exit path? A test that throws mid-assertion now still gets its article cleaned up. Tests where deletion is the actual thing under test (`article-lifecycle.spec.ts`, the create/update/delete test in `articles.spec.ts`) call `untrack()` right after their own explicit delete, so teardown doesn't go and fire a second, redundant one.

### Every page gets a Page Object

This used to be "only where it earns it" — `alerts-dialogs.spec.ts` started out with no Page Object, each scenario being a single independent interaction, on the theory that wrapping `page.getByRole('button', { name: 'Simple Alert' }).click()` in a class is ceremony without payoff.

That theory had a real cost: with some pages covered and others not, there's no reliable way to tell "raw `page.locator()` here is fine, there's genuinely no Page Object for this page" from "raw `page.locator()` here is a bypass of a Page Object that already exists" — both look identical in a diff. That ambiguity is exactly what let `forms.spec.ts` quietly reach around `FormsPage` for two fields (caught in review, not by anything structural). So now every page used in `tests/` — `FormsPage`, `AlertsDialogsPage`, `ConduitArticlePage` — has one, and `eslint.config.js` has a `no-restricted-syntax` rule flagging any `page.locator()` call inside `tests/**`. The rule can't tell _why_ a locator call is wrong, but it doesn't need to: there's no longer a legitimate reason for one to exist in a spec file at all.

Locators are `readonly Locator` fields set once in the constructor, not re-queried inline in every method — the standard Playwright POM shape. Locators are lazy (they don't touch the DOM until you act on them), so building them upfront in the constructor is safe and isn't the stale-element problem it would be in Selenium.

`ConduitArticlePage`'s `.article-content` is a CSS class selector, not a test-id — Conduit is a real third-party app with no `data-testid` attributes, so a class selector is the only option there. Same story for `AlertsDialogsPage`'s `[data-sonner-toast]` and `[role="dialog"]` — third-party toast/dialog libraries that don't expose test-ids either.

### Page Objects vs. Flows

A Page Object only knows about one page: its locators, exposed as public `readonly` fields for callers to act on directly (`formsPage.emailInput.fill(...)`, `formsPage.submitButton.click()`), plus the actions that need real logic on top of a plain locator — dynamic selector construction (`selectGender`, `toggleInterest`) or multiple steps (`selectCountry`, which resolves a healing locator and then picks an option). A trivial one-line wrapper like `async fillEmail(value) { await this.emailInput.fill(value); }` doesn't earn its keep once `emailInput` is already public — it's ceremony, not abstraction, so it doesn't exist here. The Page Object doesn't know what a "valid form submission" is, or that creating an article through the API and then viewing it is a thing someone would want to do — that's a business use case, one level up, and it lives in `src/flows/` instead.

Concretely: `formsPage.emailInput.fill(...)` is a page-level action, acting on a locator the Page Object exposes. `FormsFlow.fillValidForm(data)` — fill every field and accept terms — plus the separate `FormsFlow.submitForm()` are flows: named, reusable use cases built out of several such page-level actions. They're kept as two methods, not one, because a caller sometimes wants a filled-in form without submitting it (e.g. to assert on retained field values) — folding submit into the same method would force every caller through it. The split matters once a page is reused for more than one purpose. `forms.spec.ts`'s three negative tests (empty submit, mismatched passwords, bad email) deliberately _don't_ go through `FormsFlow` — they're testing what happens when you don't follow the happy path, so they act on `FormsPage`'s locators directly instead. If form-filling had stayed buried inside one big flow method, there'd be no way to do that without duplicating most of the form-filling logic.

`ConduitArticleFlow` is the same idea across two layers, not one: `publishAndView()` creates an article through the API and navigates to it in the UI — the actual repeated pattern in both hybrid tests — while the assertions stay in the test itself rather than inside the flow. A flow doing the _actions_ and the test doing the _checks_ keeps a failing assertion pointing at the test that has it, not at a shared method three files away.

`AlertsDialogsFlow` started from "does this page even need a flow layer, every scenario there is one click" — and turned into the most useful one once dialog-handling was a genuine source of duplication. Before this layer existed, every alert test repeated the same `page.once('dialog', ...)` + `expect.poll()` boilerplate; now it's written once.

Worth noting because it cost real debugging time: `page.waitForEvent('dialog')` looked like the cleaner way to write this and doesn't work here. A native dialog blocks the page synchronously, so the click that opens it can't resolve until the dialog is handled — and with `waitForEvent`, nothing handles it until _after_ the click's promise has already settled. That's a deadlock, and it hangs for the full test timeout instead of failing fast. The fix is to call `dialog.accept()`/`dialog.dismiss()` _inside_ the `page.once('dialog', ...)` callback itself, same as the original tests did — the handler firing doesn't depend on the click having resolved, so accepting from inside it breaks the deadlock. `expect.poll()` in the original code existed for exactly this reason: the click can resolve before the async handler finishes, so anything reading the result needs to either poll or, in the flow methods now, be wrapped in its own `Promise` that the handler resolves once it's actually done.

### Accessibility checks, baselined against a third-party site

`shouldHaveNoA11yViolations` wraps `@axe-core/playwright`'s `AxeBuilder` the same way the API matchers wrap everything else: do the check, attach what failed to the message, don't make the caller dig for it. The `a11y` fixture preconfigures it to WCAG 2.1 A/AA, the rule set most real audits actually get scored against.

First run against QA Playground turned up two real violations, `button-name` and `color-contrast`. Neither has anything to do with this suite — they're already there on a site I don't control. So the choice was: fail forever from day one, skip axe entirely, or track what's already broken and only fail on anything new. `shouldHaveNoA11yViolations(knownIssues)` does the third thing. `forms.spec.ts` and `alerts-dialogs.spec.ts` each baseline what's already wrong on that page, and a regression beyond that baseline still fails the test.

### Web Vitals budgets, not synthetic Lighthouse

`src/core/web-vitals.ts` injects the real [`web-vitals`](https://github.com/GoogleChrome/web-vitals) library into the page through `page.addInitScript`, using its IIFE build so it just sets one global instead of needing a module loader. This has to happen before navigation starts, since the LCP and TTFB observers need to attach before the page begins loading or they miss what they're measuring. `performance.spec.ts` reads LCP/TTFB/CLS after a normal page load, and INP after a real interaction (the form's submit click), through the `webVitals` fixture.

This is deliberately not a Lighthouse run. Lighthouse audits a page in isolation under throttled, synthetic conditions. This collects what Chrome itself would report for a real user navigating the page during the test — closer to what the rest of this framework already does (real API, real third-party UI) than a lab score would be.

Budgets sit at web.dev's "poor" boundary, not "good." This runs against a public demo site over a real network, and the point is catching actual regressions, not failing on ordinary network jitter. `shouldMeetWebVitalsBudget` only checks metrics that were actually measured — INP needs a real interaction to report at all, and CLS only finalizes on a visibility change, so a load-only test legitimately won't have either yet.

## CI/CD

- **`smoke.yml`** — the PR gate. Lint, format check, typecheck, then just the `@smoke`-tagged tests (7 of 30 right now). Runs in well under 2 minutes, cheap enough to not annoy anyone.
- **`all.yml`** — full suite on every push/PR, plus manual dispatch. Publishes results as a GitHub check via `dorny/test-reporter` so pass/fail/skip is visible right on the commit, not buried in a log.
- **`nightly.yml`** — scheduled full run with `retries: 2`. Publishes the HTML report to GitHub Pages, and `scripts/report-flaky.js` writes any test that needed a retry into the run's step summary (not a PR comment, since a scheduled run isn't attached to one).

## Security note

A test API key got pasted into the planning conversation for this project at one point. I treated it as compromised from then on — never committed, `.env` is git-ignored, only `.env.example` (placeholders) is tracked. It's also why `OPENROUTER_API_KEY` is fully optional everywhere it's used: the framework has to work for someone who clones this and runs it with zero secrets configured.
