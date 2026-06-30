import { expect, test } from '../../src/fixtures/page-fixtures';
import { buildFormData } from '../../src/utils/data-factory';

test.describe('Forms practice page', () => {
  // "healed locator" = the fallback-selector logic in healing-locator.ts,
  // not an LLM. See ARCHITECTURE.md if you're wondering why.
  test('submits successfully with valid data, including a healed locator @smoke', async ({
    page,
    formsPage,
  }) => {
    const data = buildFormData();
    await formsPage.goto();

    await formsPage.fill(data);
    await formsPage.acceptTerms();
    await formsPage.submit();

    await expect(formsPage.successMessage()).toBeVisible();
    await expect(
      page.getByText(`Hi ${data.firstName} ${data.lastName}, your details have been recorded.`),
    ).toBeVisible();
  });

  test('empty submit shows required-field validation errors', async ({ formsPage }) => {
    await formsPage.goto();

    await formsPage.submit();

    await expect(formsPage.errorFor('first-name')).toHaveText('First name is required.');
    await expect(formsPage.errorFor('email')).toHaveText('Email is required.');
    await expect(formsPage.errorFor('terms')).toHaveText('You must accept the terms.');
  });

  test('mismatched passwords show a confirmation error', async ({ formsPage }) => {
    await formsPage.goto();

    await formsPage.fillPassword('password123');
    await formsPage.fillConfirmPassword('different456');
    await formsPage.submit();

    await expect(formsPage.errorFor('confirm-password')).toHaveText('Passwords do not match.');
  });

  test('invalid email format shows a validation error', async ({ formsPage }) => {
    await formsPage.goto();

    await formsPage.fillEmail('not-an-email');
    await formsPage.submit();

    await expect(formsPage.errorFor('email')).toHaveText('Enter a valid email address.');
  });
});
