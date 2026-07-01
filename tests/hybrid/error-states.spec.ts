import { test, expect } from '../../src/fixtures';
import { mockMalformedJson, mockServerError, mockTimeout } from '../../src/utils/network-mocks';

// Conduit's own resilience to a failing API, not ours — verifies the app
// degrades to its home-feed fallback instead of a blank page or a crash
// when the article it's asked to render can't be fetched. Same fallback
// behavior the app already has for a nonexistent slug (see
// article-lifecycle.spec.ts), just reached through a 500 instead of a 404.
test.describe('Hybrid: Conduit UI resilience to API failures @resilience', () => {
  test('article page falls back instead of crashing when the article fetch 500s', async ({
    page,
    articlePage,
  }) => {
    const slug = 'mocked-server-error-slug';
    await page.route(`**/api/articles/${slug}`, async (route) => {
      if (route.request().method() === 'GET') {
        await mockServerError(route);
      } else {
        await route.continue();
      }
    });

    await articlePage.goto(slug);

    await expect(articlePage.content).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });

  test('article page falls back instead of hanging when the article fetch times out', async ({
    page,
    articlePage,
  }) => {
    const slug = 'mocked-timeout-slug';
    await page.route(`**/api/articles/${slug}`, async (route) => {
      if (route.request().method() === 'GET') {
        await mockTimeout(route);
      } else {
        await route.continue();
      }
    });

    await articlePage.goto(slug);

    await expect(articlePage.content).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });

  test('home page survives a malformed tags response instead of throwing', async ({
    page,
    homePage,
  }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await page.route('**/api/tags', async (route) => {
      if (route.request().method() === 'GET') {
        await mockMalformedJson(route);
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await expect(homePage.feedHeading).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });
});
