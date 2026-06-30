import { test, expect } from '../../src/fixtures';
import { buildArticlePayload } from '../../src/utils/data-factory';

test.describe('Hybrid: article lifecycle (API write, UI read)', () => {
  test('article created via API renders on the Conduit UI and is gone after API delete @smoke', async ({
    articlePage,
    articleFlow,
  }) => {
    const payload = buildArticlePayload();

    const slug = await articleFlow.publishAndView(payload);
    await expect(articlePage.heading(payload.title)).toBeVisible();
    await expect(articlePage.content).toContainText(payload.body.slice(0, 30));

    await articleFlow.deleteAndRevisit(slug);

    // No 404 page here — unknown slugs just fall back to the home feed. So
    // we check the title is gone instead of checking for an error page.
    await expect(articlePage.heading(payload.title)).toHaveCount(0);
  });
});
