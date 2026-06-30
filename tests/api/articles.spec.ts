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

  test('create, update and delete an article @smoke', async ({ articlesApi, createdArticles }) => {
    const created = await articlesApi.create(buildArticlePayload());
    expect(created).shouldMatchSchema(ArticleResponseSchema);

    const slug = created.article.slug;
    createdArticles.track(slug);

    const updatedTitle = `${created.article.title} (updated)`;
    const updated = await articlesApi.update(slug, { title: updatedTitle });
    expect(updated.article.title).shouldEqual(updatedTitle);

    // Deletion is the thing under test here, so it stays explicit; untrack
    // afterward so teardown doesn't try to delete it a second time.
    await articlesApi.delete(updated.article.slug);
    createdArticles.untrack(updated.article.slug);
  });

  test('created article is retrievable by slug before deletion', async ({
    articlesApi,
    createdArticles,
  }) => {
    const payload = buildArticlePayload();
    const created = await articlesApi.create(payload);
    createdArticles.track(created.article.slug);

    const fetched = await articlesApi.getBySlug(created.article.slug);
    expect(fetched.article.title).shouldEqual(payload.title);

    // Deletion isn't under test here — the tracker fixture cleans this up.
  });
});
