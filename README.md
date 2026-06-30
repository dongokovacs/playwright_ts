# Playwright TS Test Automation Portfolio

[![CI](https://github.com/dongokovacs/playwright_ts/actions/workflows/smoke.yml/badge.svg)](https://github.com/dongokovacs/playwright_ts/actions/workflows/smoke.yml)
[![All Tests](https://github.com/dongokovacs/playwright_ts/actions/workflows/all.yml/badge.svg)](https://github.com/dongokovacs/playwright_ts/actions/workflows/all.yml)
[![Nightly Full Suite](https://github.com/dongokovacs/playwright_ts/actions/workflows/nightly.yml/badge.svg)](https://github.com/dongokovacs/playwright_ts/actions/workflows/nightly.yml)

A Playwright + TypeScript framework built to show how I'd actually architect a test suite at a senior level, not just how I'd write individual tests.

**[ARCHITECTURE.md](./ARCHITECTURE.md) is the part that matters** — it explains why things are built this way, not just what's in the repo.

## What this is meant to show

- **Framework architecture** — fixture-based dependency injection, a fluent API client, custom expect matchers that attach failure context automatically, a deterministic self-healing locator with a heal log you can actually inspect, and a Page Object / Flow split (pages know one screen, flows know a business use case built from several).
- **AI integration** — an `AIProvider` interface (OpenRouter behind it) used for two things: semantic assertions on text that isn't fixed-wording, and Zod-validated AI-generated test data. Nothing calls the API directly from a test.
- **Hybrid API + UI testing** — write through the API, verify through the real UI, and back. Testing-pyramid thinking instead of E2E-for-everything.
- **CI/CD that's actually set up properly** — a fast `@smoke` PR gate, a full suite that publishes results as a GitHub check, and a nightly run with a published report and flaky-test detection.

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
npm run test:smoke    # fast subset, same as the PR gate
npm run test:api      # API suite against Conduit
npm run test:ui       # UI suite against QA Playground
npm run test:hybrid   # hybrid API+UI suite against Conduit
npm run test:a11y     # accessibility checks (axe-core), grep @a11y
npm run test:perf     # Core Web Vitals budgets, grep @perf
npm test               # everything
```

No credentials needed for any of this. A Conduit test user gets registered per worker automatically (`src/fixtures/auth.fixture.ts`). `OPENROUTER_API_KEY` is optional — without it, the AI-assisted hybrid test just falls back to faker data and skips the bonus semantic check. The test itself still runs and reports.

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
  core/       logger (ring buffer), self-healing locator
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

[ARCHITECTURE.md](./ARCHITECTURE.md) has the reasoning behind the layout.
