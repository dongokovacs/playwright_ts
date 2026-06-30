import type { Route } from '@playwright/test';

// Small composable route-interception helpers for simulating API failure
// modes in UI/hybrid tests, mirroring data-factory.ts's style: plain
// functions over a class, each doing one thing.

export async function mockServerError(route: Route, status = 500): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ errors: { body: ['Internal Server Error'] } }),
  });
}

export async function mockMalformedJson(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '{not-valid-json',
  });
}

export async function mockTimeout(route: Route): Promise<void> {
  // Playwright has no "hang forever" fulfill — aborting with a timed-out
  // reason is the closest equivalent without actually blocking the test
  // for a real network timeout duration.
  await route.abort('timedout');
}
