# Playwright TS Test Automation Portfolio

[![CI](https://github.com/dongokovacs/playwright_ts/actions/workflows/ci.yml/badge.svg)](https://github.com/dongokovacs/playwright_ts/actions/workflows/ci.yml)
[![Nightly Full Suite](https://github.com/dongokovacs/playwright_ts/actions/workflows/nightly.yml/badge.svg)](https://github.com/dongokovacs/playwright_ts/actions/workflows/nightly.yml)

A senior-level Playwright + TypeScript test automation framework, built to demonstrate framework architecture, AI-assisted testing, and hybrid API+UI test design — not just test scripts.

**Read [ARCHITECTURE.md](./ARCHITECTURE.md) for the reasoning behind every decision below.** That document is the actual point of this repo.

## What this demonstrates

- **Framework architecture** — fixture-based dependency injection, a fluent API client, custom expect matchers with automatic failure-context logging, and a deterministic self-healing locator with an inspectable heal log.
- **AI integration** — an `AIProvider` interface (Dependency Inversion) backed by OpenRouter, used for two concrete things: semantic assertions on non-deterministic text, and Zod-validated AI-generated test data. Never the SDK called directly from a test.
- **Hybrid API + UI testing** — tests that write through the API and verify through the real UI (and vice versa), because that's the testing-pyramid mindset, not just E2E-everything.
- **CI/CD maturity** — a fast `@smoke`-tagged PR gate, a full nightly suite with a published HTML report and automated flaky-test detection.

## Target applications

| Suite           | Target                                                        | Why                                                                                |
| --------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `tests/api/`    | [Conduit](https://conduit.bondaracademy.com/) (real REST API) | Real CRUD resources, auth, and validation — good for contract testing              |
| `tests/hybrid/` | Conduit (API + UI)                                            | API write, UI read (and back) against a real app                                   |
| `tests/ui/`     | [QA Playground](https://qaplayground.com/practice/)           | Clean, purpose-built components for locator-strategy and dialog-handling technique |

## Tech stack

TypeScript · Playwright Test · Zod · `@faker-js/faker` · OpenRouter · ESLint + Prettier · Husky + lint-staged · GitHub Actions

## Getting started

```bash
npm install
npx playwright install --with-deps chromium
cp .env.example .env   # optional — only needed to set OPENROUTER_API_KEY
```

```bash
npm run test:smoke    # fast subset, same as the PR gate
npm run test:api      # API suite against Conduit
npm run test:ui       # UI suite against QA Playground
npm run test:hybrid   # hybrid API+UI suite against Conduit
npm test               # everything
```

No credentials are required to run any suite. A Conduit test user is registered dynamically per worker (see `src/fixtures/auth.fixture.ts`). `OPENROUTER_API_KEY` is optional — without it, the AI-assisted hybrid test falls back to faker-generated data and simply skips its bonus semantic-assertion step; it never reports as a skipped test.

## Other useful scripts

```bash
npm run lint           # eslint
npm run format:check   # prettier --check
npm run typecheck       # tsc --noEmit
```

A Husky pre-commit hook runs lint-staged (eslint --fix + prettier --write) on staged files automatically.

## Project structure

```
src/
  ai/         AIProvider interface + OpenRouter implementation, assertion + data-gen helpers
  api/        fluent ApiClient, endpoint clients, Zod schemas
  core/       logger (ring buffer), self-healing locator
  expects/    custom expect matchers
  fixtures/   Playwright fixture composition — the only import path for tests
  pages/      Page Objects, used only where justified
  utils/      test data builders
tests/
  api/        Conduit API tests (CRUD + data-driven negative tests)
  ui/         QA Playground UI tests
  hybrid/     Conduit API+UI (+ AI) tests
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for why it's organized this way.
