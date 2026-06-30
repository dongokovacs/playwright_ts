import { ArticlesClient } from '../api/articles.client';
import { ApiClient } from '../api/request-handler';
import { TagsClient } from '../api/tags.client';
import { UsersClient } from '../api/users.client';
import { APILogger } from '../core/logger';
import { setActiveLogger } from '../expects/custom-expects';
import { CONDUIT_API_URL } from '../config/env';
import { test as authTest } from './auth.fixture';

type ApiFixtures = {
  apiLogger: APILogger;
  api: ApiClient;
  usersApi: UsersClient;
  articlesApi: ArticlesClient;
  tagsApi: TagsClient;
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
});
