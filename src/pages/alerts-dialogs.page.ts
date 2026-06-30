import type { Locator, Page } from '@playwright/test';
import { AlertsDialogsPageText } from '../fixtures/strings';

export class AlertsDialogsPage {
  readonly page: Page;
  readonly simpleAlertButton: Locator;
  readonly confirmAlertButton: Locator;
  readonly promptAlertButton: Locator;
  readonly toastAlertButton: Locator;
  readonly sweetAlertButton: Locator;
  readonly toast: Locator;
  readonly modal: Locator;
  readonly confirmAcceptedResult: Locator;
  readonly confirmDismissedResult: Locator;

  constructor(page: Page) {
    this.page = page;
    this.simpleAlertButton = page.getByRole('button', { name: 'Simple Alert', exact: true });
    this.confirmAlertButton = page.getByRole('button', { name: 'Confirm Alert', exact: true });
    this.promptAlertButton = page.getByRole('button', { name: 'Prompt Alert', exact: true });
    this.toastAlertButton = page.getByRole('button', { name: 'Toast Alert', exact: true });
    this.sweetAlertButton = page.getByRole('button', { name: 'Sweet Alert', exact: true });
    // No data-testid on either of these — the toast library and the dialog
    // component only expose a role/data attribute, not a test-id.
    this.toast = page.locator('[data-sonner-toast]');
    this.modal = page.locator('[role="dialog"], [role="alertdialog"]').first();
    this.confirmAcceptedResult = page.getByText(AlertsDialogsPageText.confirmAccepted);
    this.confirmDismissedResult = page.getByText(AlertsDialogsPageText.confirmDismissed);
  }

  async goto(): Promise<void> {
    await this.page.goto('alerts-dialogs');
  }

  promptResult(name: string): Locator {
    return this.page.getByText(AlertsDialogsPageText.promptResult(name));
  }

  async closeSweetAlert(): Promise<void> {
    await this.modal.getByRole('button', { name: 'Sometime' }).click();
  }
}
