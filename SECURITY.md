# Security

This is a portfolio project, not a production service, but it follows the
same basic secret-handling rules a real one would.

## Secrets

- `.env` is git-ignored. Only `.env.example` (placeholders, no real values)
  is tracked.
- `OPENROUTER_API_KEY` is the only secret this repo uses, and it's
  optional everywhere it's read: `createOpenRouterProviderFromEnv()`
  returns `undefined` if it's unset rather than throwing, and the one test
  that uses it (`tests/hybrid/ai-assisted-article.spec.ts`, `@ai`) falls
  back to faker-generated data and just skips the bonus semantic check.
  Cloning this repo and running the full suite with zero secrets configured
  is a supported path, not a degraded one.
- No other credentials are required to run the tests: `auth.fixture.ts`
  registers a fresh, throwaway Conduit user per worker at runtime via
  `@faker-js/faker`-generated credentials — there are no static/seeded test
  accounts to leak.
- CI reads `OPENROUTER_API_KEY` from a GitHub Actions secret
  (`${{ secrets.OPENROUTER_API_KEY }}`), never from a committed file.

## If you find a real secret committed in this repo

A test API key was pasted into a planning conversation for this project
once; it was treated as compromised from that point on and never committed.
If you find an actual credential anywhere in the git history or a file
here, assume it's live and should be rotated — please open an issue rather
than a PR that touches it, so it isn't re-exposed in a diff.

## Scope

This repo automates two public third-party demo applications (Conduit,
QA Playground) that it doesn't own or control. It doesn't process real user
data, and there's no production deployment of anything in here.
