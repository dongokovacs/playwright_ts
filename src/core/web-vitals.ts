import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Page } from '@playwright/test';

// The web-vitals IIFE bundle (not the ESM build) — it sets a single global
// (`webVitals`) when injected as a plain <script>, which is what
// page.addInitScript needs. Read once at module load, reused for every
// page the fixture wires up.
//
// The package's "exports" map doesn't expose "./dist/web-vitals.iife.js" (or
// even "./package.json") directly, so neither resolves via require.resolve.
// The "." entry does, though, and it resolves into the same dist/ folder
// the iife build lives in — resolve that, then go find its sibling file.
const webVitalsDistDir = dirname(require.resolve('web-vitals'));
const WEB_VITALS_SCRIPT = readFileSync(join(webVitalsDistDir, 'web-vitals.iife.js'), 'utf-8');

export type WebVitalsMetrics = {
  lcp?: number;
  cls?: number;
  inp?: number;
  ttfb?: number;
};

// Registers the collector before any page script runs. Has to happen via
// addInitScript (not evaluate after navigation) because LCP/TTFB observers
// need to attach before the page starts loading, or they miss the entries
// they're measuring.
export async function startWebVitalsCollection(page: Page): Promise<void> {
  await page.addInitScript({
    content: `
      ${WEB_VITALS_SCRIPT}
      window.__webVitals = {};
      webVitals.onLCP((m) => { window.__webVitals.lcp = m.value; }, { reportAllChanges: true });
      webVitals.onCLS((m) => { window.__webVitals.cls = m.value; }, { reportAllChanges: true });
      webVitals.onINP((m) => { window.__webVitals.inp = m.value; }, { reportAllChanges: true });
      webVitals.onTTFB((m) => { window.__webVitals.ttfb = m.value; });
    `,
  });
}

// INP only reports once the page has seen a user interaction, and CLS
// finalizes on visibility change — neither is guaranteed by the time a test
// reads this, even with reportAllChanges. Treat both as "not measured in
// this run" rather than a failure; see shouldMeetWebVitalsBudget.
export async function collectWebVitals(page: Page): Promise<WebVitalsMetrics> {
  // globalThis, not `window` — this file has no DOM lib (it's a Node-side
  // module), so it can only reference globals ES2022 already knows about.
  // The cast is safe: this callback only ever runs inside the browser page.
  return page.evaluate(
    () => (globalThis as unknown as { __webVitals: WebVitalsMetrics }).__webVitals,
  );
}
