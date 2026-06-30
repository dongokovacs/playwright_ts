import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
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
  // Preconfigured to WCAG 2.1 A/AA — the rule set most third-party
  // accessibility audits are actually scored against.
  a11y: AxeBuilder;
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

  a11y: async ({ page }, use) => {
    await use(new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']));
  },
});

// Re-exported from custom-expects.ts (not '@playwright/test' directly) so
// UI specs get shouldHaveNoA11yViolations and the rest of the suite's
// matchers from the same place api/hybrid specs do.
export { expect } from '../expects/custom-expects';
