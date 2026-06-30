import type { ArticlesClient, CreateArticlePayload } from '../api/articles.client';
import type { ConduitArticlePage } from '../pages/conduit-article.page';

// The hybrid tests' actual business use case — write through the API, view
// through the UI, and back — lives here instead of being repeated in every
// hybrid spec. Assertions stay in the tests; this layer only does the
// actions (create/navigate/delete), so a failing assertion still points at
// the test, not at a flow method three files away.
export class ConduitArticleFlow {
  constructor(
    private readonly articlesApi: ArticlesClient,
    private readonly articlePage: ConduitArticlePage,
  ) {}

  async publishAndView(payload: CreateArticlePayload): Promise<string> {
    const created = await this.articlesApi.create(payload);
    await this.articlePage.goto(created.article.slug);
    return created.article.slug;
  }

  async deleteAndRevisit(slug: string): Promise<void> {
    await this.articlesApi.delete(slug);
    await this.articlePage.goto(slug);
  }
}
