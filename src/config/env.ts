// One place for these URLs — playwright.config.ts and the fixtures that
// build their own request context both import from here, so the fallback
// values can't drift out of sync (they did once, see git history).
export const CONDUIT_API_URL =
  process.env.CONDUIT_API_URL ?? 'https://conduit-api.bondaracademy.com/api';
export const CONDUIT_UI_URL = process.env.CONDUIT_UI_URL ?? 'https://conduit.bondaracademy.com/';
