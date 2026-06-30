import { test as base, request } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { ApiClient } from '../api/request-handler';
import { UsersClient } from '../api/users.client';
import { APILogger } from '../core/logger';
import { CONDUIT_API_URL } from '../config/env';

type AuthWorkerFixtures = {
  authToken: string;
};

// One throwaway Conduit user per worker, not per test, so login only
// happens once even if a worker runs ten test files. Workers still run in
// parallel, each with its own user.
export const test = base.extend<object, AuthWorkerFixtures>({
  authToken: [
    async ({}, use) => {
      const context = await request.newContext();
      const logger = new APILogger();
      const api = new ApiClient(context, CONDUIT_API_URL, logger);
      const usersClient = new UsersClient(api);

      const username = `sdet_${faker.string.alphanumeric({ length: 10, casing: 'lower' })}`;
      const email = `${username}@example.com`;
      const password = faker.internet.password({ length: 12 });

      const { user } = await usersClient.register(username, email, password);

      await use(`Token ${user.token}`);
      await context.dispose();
    },
    { scope: 'worker' },
  ],
});
