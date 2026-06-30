import { test as base } from '@playwright/test';
import { FormsPage } from '../pages/forms.page';

// UI-only fixtures (Page Objects), separate from the API/auth chain in
// index.ts — the `ui` project tests don't need a Conduit auth token.
type PageFixtures = {
  formsPage: FormsPage;
};

export const test = base.extend<PageFixtures>({
  formsPage: async ({ page }, use) => {
    await use(new FormsPage(page));
  },
});

export { expect } from '@playwright/test';
