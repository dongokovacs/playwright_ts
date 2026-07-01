import { expect, test } from '../../src/fixtures/page.fixtures';
import { FormsPageText } from '../../src/fixtures/strings';
import { buildFormData } from '../../src/utils/data-factory';

test.describe('Forms practice page', () => {
  // "healed locator" = the fallback-selector logic in healing-locator.ts,
  // not an LLM. See ARCHITECTURE.md if you're wondering why.
  test('submits successfully with valid data, including a healed locator @smoke', async ({
    formsPage,
    formsFlow,
  }) => {
    const data = buildFormData();

    await formsFlow.submitValidForm(data);

    await expect(formsPage.successMessage()).toBeVisible();
    await expect(formsPage.successDetail(data.firstName, data.lastName)).toBeVisible();
  });

  test('empty submit shows required-field validation errors', async ({ formsPage }) => {
    await formsPage.goto();

    await formsPage.submit();

    await expect(formsPage.errorFor('first-name')).toHaveText(
      FormsPageText.errors.firstNameRequired,
    );
    await expect(formsPage.errorFor('email')).toHaveText(FormsPageText.errors.emailRequired);
    await expect(formsPage.errorFor('terms')).toHaveText(FormsPageText.errors.termsRequired);
  });

  test('mismatched passwords show a confirmation error', async ({ formsPage }) => {
    await formsPage.goto();

    await formsPage.fillPassword('password123');
    await formsPage.fillConfirmPassword('different456');
    await formsPage.submit();

    await expect(formsPage.errorFor('confirm-password')).toHaveText(
      FormsPageText.errors.passwordMismatch,
    );
  });

  test('invalid email format shows a validation error', async ({ formsPage }) => {
    await formsPage.goto();

    await formsPage.fillEmail('not-an-email');
    await formsPage.submit();

    await expect(formsPage.errorFor('email')).toHaveText(FormsPageText.errors.invalidEmail);
  });

  test('has no detectable accessibility violations @a11y', async ({ formsPage, a11y }) => {
    await formsPage.goto();

    const results = await a11y.analyze();

    // QA Playground is a third-party demo site; these two are pre-existing
    // there, not something this suite can fix. Tracked as a known baseline
    // so the test still catches anything new instead of being all-or-nothing.
    const knownIssues = ['button-name', 'color-contrast'];
    expect(results).shouldHaveNoA11yViolations(knownIssues);
  });
});
