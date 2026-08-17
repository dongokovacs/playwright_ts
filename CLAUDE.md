# Working in this repo

This file is the fast-path summary for an AI coding assistant. It exists so
the rules below are followed _before_ code is written, not caught by lint or
review afterward. [ARCHITECTURE.md](./ARCHITECTURE.md) has the reasoning
behind each one; [CONTRIBUTING.md](./CONTRIBUTING.md) has the "how do I add
X" walkthroughs. Read those before doing anything non-trivial — this file is
a checklist, not a replacement for them.

## Hard rules (not stylistic preferences)

- **No `page.locator()` in `tests/**`.** Enforced by `eslint.config.js`
  (`no-restricted-syntax`, `error`, not `warn`). If a test needs a new
  locator, it goes on a Page Object method. No Page Object yet for that
  page? Add one — see "Adding a Page Object" in CONTRIBUTING.md.
- **Tests only import from `src/fixtures`** (plus `src/utils` / `src/api/schemas`
  for data builders and types). Never import `test`/`expect` from
  `@playwright/test` directly in a spec, and never reach into
  `request-handler.ts` or `core/*` from a test.
- **Every page used in `tests/` gets a Page Object.** One page, one class,
  `readonly Locator` fields built once in the constructor. Locators are
  public for callers to act on directly; only add a method where there's
  real logic (dynamic selectors, multi-step sequences) — a one-line wrapper
  around an already-public locator doesn't earn its keep.
- **Business use cases go in `src/flows/`, not Page Objects.** A Page Object
  knows one screen. A Flow composes Page Objects (+ API clients for hybrid
  flows) into a named, reusable sequence. Assertions stay in the test, not
  in the Flow.
- **API response shapes are Zod schemas** in `src/api/schemas/*.schema.ts`.
  Derive the TS type with `z.infer<typeof Schema>` — never hand-write a type
  next to a schema that can drift from it.
- **Any new LLM use case goes through `AIProvider`** (`generateText` /
  `generateJson`), never a provider SDK/API directly from a test or fixture.
  `OpenRouterProvider` is the only file allowed to know OpenRouter exists.
  AI-backed helpers must degrade gracefully when `OPENROUTER_API_KEY` is
  unset — never make a test hard-fail or hang for lack of a key.
- **No hard waits.** No `waitForTimeout()`. Use web-first assertions
  (`expect(locator).toBeVisible()`, etc.) or `expect.poll()` where a
  condition genuinely needs polling (see the dialog-handling notes in
  ARCHITECTURE.md for why `waitForEvent('dialog')` is the wrong tool there).
- **State-mutating tests clean up.** Track created resources and delete them
  in fixture teardown (`createdArticles` in `api.fixture.ts` is the
  pattern), so cleanup survives a mid-test assertion failure instead of
  relying on every spec remembering its own `afterEach`.
- **Tag discipline:** a new category of test gets its `@tag` and its
  `npm run test:<tag>` script added together, not the tag now and the
  script "later."

## Before generating a new Page Object or locator

Don't guess selectors from a description or from training data. Explore the
real page first, then write locators against what's actually there:

1. Run `npx playwright codegen <url>` against the target page (or drive it
   with an MCP browser tool) to see the actual accessible roles, labels,
   and test-ids present in the DOM.
2. Prefer, in order: `getByRole()` > `getByLabel()` > `getByPlaceholder()` >
   `getByText()` > `getByTestId()`. Fall back to a CSS class or ARIA role
   selector only for third-party pages with no `data-testid` (see
   `ConduitArticlePage`, `AlertsDialogsPage` for real examples of that
   compromise, and why).
3. Only then write the Page Object's constructor locators.

This is the single biggest source of AI-generated test breakage — a locator
that looks plausible but doesn't match the real DOM. Exploring first instead
of generating from a guess avoids it without adding any new tooling.

## Before proposing an architectural change

If a task looks like it needs a new cross-cutting pattern (a new fixture
chain, a new top-level `src/` directory, a new custom matcher shape), check
ARCHITECTURE.md's "Key decisions" section first — there's a good chance the
alternative was already considered and rejected for a stated reason (e.g.
`workers: 1` vs. worker-scoped auth, LLM-based healing vs. deterministic
healing). Don't re-litigate a documented decision without a new reason.
