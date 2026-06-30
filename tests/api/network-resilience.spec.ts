import { test } from '../../src/fixtures';
import { buildArticlePayload } from '../../src/utils/data-factory';

// Negative paths the happy-path articles.spec.ts doesn't cover: requests
// that fail for reasons other than bad input — a resource that doesn't
// exist, or a write attempted without auth. These go through `api`
// directly rather than adding one-off "ExpectingError" methods to
// ArticlesClient for cases that aren't part of its real contract.
test.describe('Articles API — error paths @resilience', () => {
  test('GET a nonexistent slug returns 404', async ({ api }) => {
    await api.path('/articles/this-slug-does-not-exist-xyz123').getRequest(404);
  });

  test('PUT without auth on an existing article returns 401', async ({
    api,
    articlesApi,
    createdArticles,
  }) => {
    const created = await articlesApi.create(buildArticlePayload());
    createdArticles.track(created.article.slug);

    await api
      .path(`/articles/${created.article.slug}`)
      .clearAuth()
      .body({ article: { title: 'should not apply' } })
      .putRequest(401);
  });

  test('DELETE without auth on an existing article returns 401', async ({
    api,
    articlesApi,
    createdArticles,
  }) => {
    const created = await articlesApi.create(buildArticlePayload());
    createdArticles.track(created.article.slug);

    await api.path(`/articles/${created.article.slug}`).clearAuth().deleteRequest(401);
  });
});
