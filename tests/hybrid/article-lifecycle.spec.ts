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

    // No 404 page here — unknown slugs just fall back to the home feed. So
    // we check the title is gone instead of checking for an error page.
    await page.goto(`article/${slug}`);
    await expect(page.getByRole('heading', { level: 1, name: payload.title })).toHaveCount(0);
  });
});
