import { expect as baseExpect } from '@playwright/test';
import { isDeepStrictEqual } from 'node:util';
import type { ZodType } from 'zod';
import type { AxeResults } from 'axe-core';
import type { APILogger } from '../core/logger';
import type { WebVitalsMetrics } from '../core/web-vitals';

let activeLogger: APILogger | undefined;

// Set once per test from the api fixture, so the matchers below can attach
// recent request/response logs without every test wiring it through manually.
export function setActiveLogger(logger: APILogger): void {
  activeLogger = logger;
}

function recentLogsOrEmpty(): string {
  return activeLogger ? activeLogger.getRecentLogs() : '(no API logger active for this test)';
}

export const expect = baseExpect.extend({
  shouldMatchSchema(received: unknown, schema: ZodType) {
    const result = schema.safeParse(received);
    const pass = result.success;

    const message = pass
      ? () => 'expected response not to match schema, but it did'
      : () =>
          [
            'Response failed schema validation:',
            result.success ? '' : JSON.stringify(result.error.issues, null, 2),
            '',
            'Received body:',
            JSON.stringify(received, null, 2),
            '',
            'Recent API activity:',
            recentLogsOrEmpty(),
          ].join('\n');

    return { pass, message };
  },

  shouldEqual(received: unknown, expected: unknown) {
    // Playwright's matcher context doesn't expose this.equals, so this
    // is the deep-equal fallback (see ARCHITECTURE.md).
    const pass = isDeepStrictEqual(received, expected);

    const message = pass
      ? () =>
          `expected ${this.utils.printReceived(received)} not to equal ${this.utils.printExpected(expected)}`
      : () =>
          [
            `expected ${this.utils.printReceived(received)} to equal ${this.utils.printExpected(expected)}`,
            '',
            'Recent API activity:',
            recentLogsOrEmpty(),
          ].join('\n');

    return { pass, message };
  },

  // knownIssues lets a test acknowledge pre-existing violations on a
  // third-party page we don't control (rule ID, e.g. "color-contrast")
  // instead of either failing on day one or silently ignoring axe
  // altogether. Anything not in the list still fails the test, so a new
  // violation is still caught.
  shouldHaveNoA11yViolations(received: AxeResults, knownIssues: string[] = []) {
    const newViolations = received.violations.filter((v) => !knownIssues.includes(v.id));
    const pass = newViolations.length === 0;

    const message = pass
      ? () => 'expected accessibility violations, but found none'
      : () =>
          [
            `Found ${newViolations.length} accessibility violation(s) not in the known-issues baseline:`,
            ...newViolations.map(
              (v) =>
                `- [${v.impact ?? 'unknown'}] ${v.id}: ${v.help} (${v.nodes.length} node(s)) — ${v.helpUrl}`,
            ),
          ].join('\n');

    return { pass, message };
  },

  // Only checks metrics that were actually measured. INP needs a real user
  // interaction to report at all, and CLS only finalizes on a visibility
  // change — a budget-only test that just loads a page won't always have
  // either, and that's "not measured here", not a failure.
  shouldMeetWebVitalsBudget(received: WebVitalsMetrics, budget: Partial<WebVitalsMetrics>) {
    const overBudget = (Object.entries(budget) as [keyof WebVitalsMetrics, number][]).filter(
      ([metric, limit]) => {
        const value = received[metric];
        return value !== undefined && value > limit;
      },
    );
    const pass = overBudget.length === 0;

    const message = pass
      ? () => 'expected at least one web vital to be over budget, but none were'
      : () =>
          [
            'Web vitals exceeded budget:',
            ...overBudget.map(
              ([metric, limit]) => `- ${metric}: ${received[metric]} (budget: ${limit})`,
            ),
            '',
            `All collected metrics: ${JSON.stringify(received)}`,
          ].join('\n');

    return { pass, message };
  },
});

declare module '@playwright/test' {
  interface Matchers<R, T> {
    shouldMatchSchema(schema: ZodType): R;
    shouldEqual(expected: T): R;
    shouldHaveNoA11yViolations(knownIssues?: string[]): R;
    shouldMeetWebVitalsBudget(budget: Partial<WebVitalsMetrics>): R;
  }
}
