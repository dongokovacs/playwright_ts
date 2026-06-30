import { test, expect } from '../../src/fixtures';
import {
  ArticleResponseSchema,
  ArticlesListResponseSchema,
} from '../../src/api/schemas/article.schema';
import { buildArticlePayload } from '../../src/utils/data-factory';

test.describe('Articles API', () => {
  test('GET /articles @smoke returns a schema-valid paginated list', async ({ articlesApi }) => {
    const response = await articlesApi.list(10, 0);

    expect(response).shouldMatchSchema(ArticlesListResponseSchema);
    expect(response.articles.length).toBeLessThanOrEqual(10);
  });

  test('create, update and delete an article @smoke', async ({ articlesApi }) => {
    const created = await articlesApi.create(buildArticlePayload());
    expect(created).shouldMatchSchema(ArticleResponseSchema);

    const slug = created.article.slug;

    const updatedTitle = `${created.article.title} (updated)`;
    const updated = await articlesApi.update(slug, { title: updatedTitle });
    expect(updated.article.title).shouldEqual(updatedTitle);

    await articlesApi.delete(updated.article.slug);
  });

  test('created article is retrievable by slug before deletion', async ({ articlesApi }) => {
    const payload = buildArticlePayload();
    const created = await articlesApi.create(payload);

    const fetched = await articlesApi.getBySlug(created.article.slug);
    expect(fetched.article.title).shouldEqual(payload.title);

    await articlesApi.delete(created.article.slug);
  });
});
