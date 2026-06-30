import { expect as baseExpect } from '@playwright/test';
import { isDeepStrictEqual } from 'node:util';
import type { ZodType } from 'zod';
import type { APILogger } from '../core/logger';

let activeLogger: APILogger | undefined;

/**
 * Called once per test (from the api fixture) so the matchers below can
 * attach the last N request/response pairs to a failure message without
 * every test having to pass the logger in manually.
 */
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
    //not just primitives the isDeepStrictEqual
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
});

declare module '@playwright/test' {
  interface Matchers<R, T> {
    shouldMatchSchema(schema: ZodType): R;
    shouldEqual(expected: T): R;
  }
}
