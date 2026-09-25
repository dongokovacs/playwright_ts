# Playwright TS Test Automation Portfolio

[![CI](https://github.com/dongokovacs/playwright_ts/actions/workflows/ci.yml/badge.svg)](https://github.com/dongokovacs/playwright_ts/actions/workflows/ci.yml)
[![Nightly Full Suite](https://github.com/dongokovacs/playwright_ts/actions/workflows/nightly.yml/badge.svg)](https://github.com/dongokovacs/playwright_ts/actions/workflows/nightly.yml)

A Playwright + TypeScript framework built to show how I'd actually architect a test suite at a senior level, not just how I'd write individual tests.

**[ARCHITECTURE.md](./ARCHITECTURE.md) is the part that matters** — it explains why things are built this way, not just what's in the repo.

Written with an AI assistant's help (docs included), but every architectural decision in here is mine and I can defend any of it in a live conversation — treat that as the actual test, not the prose.

## What this is meant to show

- **Framework architecture** — fixture-based dependency injection, a fluent API client, custom expect matchers that attach failure context automatically, a deterministic self-healing locator with a heal log you can actually inspect, and a Page Object / Flow split (pages know one screen, flows know a business use case built from several).
- **AI integration** — an `AIProvider` interface (OpenRouter behind it), reached from tests only through an `aiProvider` fixture, used in the two roles an LLM can legitimately play in a test: generating Zod-validated test data, and judging the meaning of copy we don't own — at temperature 0, prompt-injection-aware, with a negative control. Every prompt/response pair lands in the HTML report.
- **Hybrid API + UI testing** — write through the API, verify through the real UI, and back. Testing-pyramid thinking instead of E2E-for-everything.
- **CI/CD that's actually set up properly** — one staged pipeline (static checks → full suite, published as a GitHub check and to Pages), and a nightly run with flaky-test detection.

## Target applications

| Suite           | Target                                                        | Why                                                                              |
| --------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `tests/api/`    | [Conduit](https://conduit.bondaracademy.com/) (real REST API) | Real CRUD resources, auth, and validation — a fair target for contract testing   |
| `tests/hybrid/` | Conduit (API + UI)                                            | API write, UI read, and back, against a real app                                 |
| `tests/ui/`     | [QA Playground](https://qaplayground.com/practice/)           | Clean components, so the suite can focus on locator strategy and dialog handling |

## Tech stack

TypeScript · Playwright Test · Zod · `@faker-js/faker` · OpenRouter · ESLint + Prettier · Husky + lint-staged · GitHub Actions

## Getting started

Node version is pinned in `.nvmrc` (run `nvm use` if you have nvm).

```bash
npm install
npx playwright install --with-deps chromium
cp .env.example .env   # optional — only needed if you want OPENROUTER_API_KEY set
```

```bash
npm run test:smoke    # fast subset for quick local runs
npm run test:api      # API suite against Conduit
npm run test:ui       # UI suite against QA Playground
npm run test:hybrid   # hybrid API+UI suite against Conduit
npm run test:a11y     # accessibility checks (axe-core), grep @a11y
npm run test:perf     # Core Web Vitals budgets, grep @perf
npm run test:resilience # network failure / error-path tests, grep @resilience
npm run test:negative  # data-driven input validation tests, grep @negative
npm run test:ai        # the LLM-backed hybrid tests, grep @ai
npm test               # everything
```

No credentials needed for any of this. A Conduit test user gets registered per worker automatically (`src/fixtures/auth.fixture.ts`). `OPENROUTER_API_KEY` is optional — without it, the `@ai` tests fall back to faker data or skip only their semantic check, and say so in a test annotation. The tests themselves still run and report.

### Running with Docker

Skips the local Node/Playwright-browser setup entirely — the image is pinned to the same Playwright version this repo uses, so it's the same environment CI runs in.

```bash
docker build -t playwright-ts-portfolio .
docker run --rm playwright-ts-portfolio
```

## Other useful scripts

```bash
npm run lint           # eslint
npm run format:check   # prettier --check
npm run typecheck       # tsc --noEmit
```

There's a Husky pre-commit hook running lint-staged on whatever's staged.

## Project structure

```
src/
  ai/         AIProvider interface + OpenRouter implementation, assertion + data-gen helpers
  api/        fluent ApiClient, endpoint clients, Zod schemas
  core/       logger (ring buffer), self-healing locator, web-vitals collector
  expects/    custom expect matchers
  fixtures/   Playwright fixture composition — the only import path for tests
  flows/      named business use cases, composed from Page Objects
  pages/      Page Objects — one per page used in tests
  utils/      test data builders
tests/
  api/        Conduit API tests (CRUD + data-driven negative tests)
  ui/         QA Playground UI tests
  hybrid/     Conduit API+UI (+ AI) tests
```

[ARCHITECTURE.md](./ARCHITECTURE.md) has the reasoning behind the layout. [CONTRIBUTING.md](./CONTRIBUTING.md) covers how to add to it, whether that's a new Page Object, a fixture, or anything else.
