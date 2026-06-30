import { expect, test } from '@playwright/test';
import { FormsPage } from '../../src/pages/forms.page';

test.describe('Forms practice page', () => {
  // The healing here is the plain, deterministic fallback-locator strategy in
  // src/core/healing-locator.ts — NOT an AI/LLM-based healer. No API call,
  // no cost, no network round-trip; it just tries the next known selector
  // in order. See ARCHITECTURE.md for why that tradeoff was chosen.
  test('submits successfully with valid data, including a healed locator @smoke', async ({
    page,
  }) => {
    const formsPage = new FormsPage(page);
    await formsPage.goto();

    await formsPage.fill({
      firstName: 'Dani',
      lastName: 'Kovacs',
      email: 'dani.kovacs.qa@example.com',
      phone: '9876543210',
      dob: '1990-01-01',
      gender: 'male',
      country: 'Germany',
      city: 'Budapest',
      interests: ['playwright'],
      password: 'password123',
      confirmPassword: 'password123',
    });
    await formsPage.acceptTerms();
    await formsPage.submit();

    await expect(formsPage.successMessage()).toBeVisible();
    await expect(page.getByText('Hi Dani Kovacs, your details have been recorded.')).toBeVisible();
  });

  test('empty submit shows required-field validation errors', async ({ page }) => {
    const formsPage = new FormsPage(page);
    await formsPage.goto();

    await formsPage.submit();

    await expect(formsPage.errorFor('first-name')).toHaveText('First name is required.');
    await expect(formsPage.errorFor('email')).toHaveText('Email is required.');
    await expect(formsPage.errorFor('terms')).toHaveText('You must accept the terms.');
  });

  test('mismatched passwords show a confirmation error', async ({ page }) => {
    const formsPage = new FormsPage(page);
    await formsPage.goto();

    await page.locator('#password').fill('password123');
    await page.locator('#confirmPassword').fill('different456');
    await formsPage.submit();

    await expect(formsPage.errorFor('confirm-password')).toHaveText('Passwords do not match.');
  });

  test('invalid email format shows a validation error', async ({ page }) => {
    const formsPage = new FormsPage(page);
    await formsPage.goto();

    await page.locator('#email').fill('not-an-email');
    await formsPage.submit();

    await expect(formsPage.errorFor('email')).toHaveText('Enter a valid email address.');
  });
});
