import { test as base } from '@playwright/test';
import { FormsPage } from '../pages/forms.page';
import { AlertsDialogsPage } from '../pages/alerts-dialogs.page';
import { FormsFlow } from '../flows/forms.flow';
import { AlertsDialogsFlow } from '../flows/alerts-dialogs.flow';

// UI-only fixtures (Page Objects + Flows), separate from the API/auth chain
// in index.ts — the `ui` project tests don't need a Conduit auth token.
type PageFixtures = {
  formsPage: FormsPage;
  formsFlow: FormsFlow;
  alertsDialogsPage: AlertsDialogsPage;
  alertsDialogsFlow: AlertsDialogsFlow;
};

export const test = base.extend<PageFixtures>({
  formsPage: async ({ page }, use) => {
    await use(new FormsPage(page));
  },

  formsFlow: async ({ formsPage }, use) => {
    await use(new FormsFlow(formsPage));
  },

  alertsDialogsPage: async ({ page }, use) => {
    await use(new AlertsDialogsPage(page));
  },

  alertsDialogsFlow: async ({ page, alertsDialogsPage }, use) => {
    await use(new AlertsDialogsFlow(page, alertsDialogsPage));
  },
});

export { expect } from '@playwright/test';
