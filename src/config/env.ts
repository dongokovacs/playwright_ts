/**
 * Single source of truth for environment-driven URLs. Imported by
 * playwright.config.ts and the fixtures that need to build their own
 * APIRequestContext outside of a project's configured baseURL (e.g. the
 * worker-scoped auth fixture). Having one place for this avoids the fallback
 * values silently drifting apart between files.
 */
export const CONDUIT_API_URL =
  process.env.CONDUIT_API_URL ?? 'https://conduit-api.bondaracademy.com/api';
export const CONDUIT_UI_URL = process.env.CONDUIT_UI_URL ?? 'https://conduit.bondaracademy.com/';
