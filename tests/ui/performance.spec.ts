import { expect, test } from '../../src/fixtures/page.fixtures';
import { buildFormData } from '../../src/utils/data-factory';

// Budgets are set at the "poor" boundary from web.dev's own thresholds
// (https://web.dev/articles/lcp, /cls, /inp, /ttfb), not the "good" one —
// this runs against a public third-party demo site over a real network, so
// the bar is "not actually broken", not "lab-perfect". Tightening these to
// the "good" thresholds would make the suite flaky on nothing but network
// variance, which isn't the thing this test exists to catch.
const PAGE_LOAD_BUDGET = { lcp: 4000, ttfb: 1800, cls: 0.25 };
const INTERACTION_BUDGET = { inp: 500 };

test.describe('Performance: Core Web Vitals @perf', () => {
  test('forms page loads within budget', async ({ formsPage, webVitals }) => {
    await formsPage.goto();
    await formsPage.firstNameInput.waitFor();

    const metrics = await webVitals.collect();

    expect(metrics).shouldMeetWebVitalsBudget(PAGE_LOAD_BUDGET);
  });

  test('submitting the form stays within an interaction budget', async ({
    formsFlow,
    webVitals,
  }) => {
    await formsFlow.submitValidForm(buildFormData());

    // INP only reports after the interaction that triggered it has been
    // processed and the browser's gone idle — give it a beat before reading.
    await new Promise((resolve) => setTimeout(resolve, 200));
    const metrics = await webVitals.collect();

    expect(metrics).shouldMeetWebVitalsBudget(INTERACTION_BUDGET);
  });
});
