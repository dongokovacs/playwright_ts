import { expect, test } from '@playwright/test';

test.describe('Alerts & Dialogs practice page', () => {
  test('accepts a simple browser alert and reads its message @smoke', async ({ page }) => {
    await page.goto('alerts-dialogs');

    let alertMessage = '';
    page.once('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Simple Alert', exact: true }).click();
    await expect.poll(() => alertMessage).toBe('Welcome to QA PlayGround!');
  });

  test('accepting the confirm dialog records an Accepted result', async ({ page }) => {
    await page.goto('alerts-dialogs');

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Confirm Alert', exact: true }).click();

    await expect(page.getByText('Result: Accepted')).toBeVisible();
  });

  test('dismissing the confirm dialog records a Dismissed result', async ({ page }) => {
    await page.goto('alerts-dialogs');

    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: 'Confirm Alert', exact: true }).click();

    await expect(page.getByText('Result: Dismissed')).toBeVisible();
  });

  test('typed prompt input is captured after accepting', async ({ page }) => {
    await page.goto('alerts-dialogs');

    page.once('dialog', (dialog) => dialog.accept('healing-locator-demo'));
    await page.getByRole('button', { name: 'Prompt Alert', exact: true }).click();

    await expect(page.getByText('Your name is — healing-locator-demo')).toBeVisible();
  });

  test('toast alert renders a [data-sonner-toast] element @smoke', async ({ page }) => {
    await page.goto('alerts-dialogs');

    await page.getByRole('button', { name: 'Toast Alert', exact: true }).click();

    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('This is simple toast.');
  });

  test('sweet alert modal shows its title and can be closed', async ({ page }) => {
    await page.goto('alerts-dialogs');

    await page.getByRole('button', { name: 'Sweet Alert', exact: true }).click();

    const modal = page.locator('[role="dialog"], [role="alertdialog"]').first();
    await expect(modal).toContainText('Modern Alert');

    await modal.getByRole('button', { name: 'Sometime' }).click();
    await expect(modal).toBeHidden();
  });
});
