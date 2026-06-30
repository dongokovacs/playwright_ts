import { ArticlesClient } from '../api/articles.client';
import { ApiClient } from '../api/request-handler';
import { TagsClient } from '../api/tags.client';
import { UsersClient } from '../api/users.client';
import { APILogger } from '../core/logger';
import { setActiveLogger } from '../expects/custom-expects';
import { CONDUIT_API_URL } from '../config/env';
import { ConduitArticlePage } from '../pages/conduit-article.page';
import { ConduitArticleFlow } from '../flows/conduit-article.flow';
import { test as authTest } from './auth.fixture';

export type CreatedArticlesTracker = {
  track: (slug: string) => void;
  untrack: (slug: string) => void;
};

type ApiFixtures = {
  apiLogger: APILogger;
  api: ApiClient;
  usersApi: UsersClient;
  articlesApi: ArticlesClient;
  tagsApi: TagsClient;
  // UI Page Object + Flow, used only by tests/hybrid (tests/api never
  // requests them, so they're never instantiated there).
  articlePage: ConduitArticlePage;
  articleFlow: ConduitArticleFlow;
  // Safety-net cleanup for articles created in a test. Tests that aren't
  // testing deletion itself just track(); tests that delete as part of the
  // assertion should untrack() right after so teardown doesn't double-delete.
  createdArticles: CreatedArticlesTracker;
};

export const test = authTest.extend<ApiFixtures>({
  apiLogger: async ({}, use) => {
    const logger = new APILogger();
    setActiveLogger(logger);
    await use(logger);
  },

  api: async ({ request, authToken, apiLogger }, use) => {
    await use(new ApiClient(request, CONDUIT_API_URL, apiLogger, authToken));
  },

  usersApi: async ({ api }, use) => {
    await use(new UsersClient(api));
  },

  articlesApi: async ({ api }, use) => {
    await use(new ArticlesClient(api));
  },

  tagsApi: async ({ api }, use) => {
    await use(new TagsClient(api));
  },

  articlePage: async ({ page }, use) => {
    await use(new ConduitArticlePage(page));
  },

  articleFlow: async ({ articlesApi, articlePage }, use) => {
    await use(new ConduitArticleFlow(articlesApi, articlePage));
  },

  createdArticles: async ({ articlesApi }, use) => {
    const slugs = new Set<string>();
    await use({
      track: (slug: string) => slugs.add(slug),
      untrack: (slug: string) => slugs.delete(slug),
    });
    for (const slug of slugs) {
      // Best-effort: the test may have failed before reaching its own
      // delete, or the article may genuinely still be there. Either way a
      // cleanup failure shouldn't fail the test.
      await articlesApi.delete(slug).catch(() => {});
    }
  },
});
