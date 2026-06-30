import { test, expect } from '../../src/fixtures';
import { buildArticlePayload } from '../../src/utils/data-factory';

test.describe('Hybrid: article lifecycle (API write, UI read)', () => {
  test('article created via API renders on the Conduit UI and is gone after API delete @smoke', async ({
    page,
    articlesApi,
  }) => {
    const payload = buildArticlePayload();
    const created = await articlesApi.create(payload);
    const slug = created.article.slug;

    await page.goto(`article/${slug}`);
    await expect(page.getByRole('heading', { level: 1, name: payload.title })).toBeVisible();
    await expect(page.locator('.article-content')).toContainText(payload.body.slice(0, 30));

    await articlesApi.delete(slug);

    // The SPA falls back to the home feed for an unknown slug rather than a
    // dedicated 404 page, so the meaningful assertion is that the article's
    // own title no longer renders anywhere on the page it used to own.
    await page.goto(`article/${slug}`);
    await expect(page.getByRole('heading', { level: 1, name: payload.title })).toHaveCount(0);
  });
});
