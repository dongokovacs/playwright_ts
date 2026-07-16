import type { Page } from '@playwright/test';
import type { AlertsDialogsPage } from '../pages/alerts-dialogs.page';

// One named use case per scenario on the practice page. All dialogs here are
// CSS/DOM modals (role="dialog"), not native browser alerts, so there is no
// page.on('dialog', ...) handling required — plain locator clicks work.
export class AlertsDialogsFlow {
  constructor(
    private readonly page: Page,
    private readonly alertsDialogsPage: AlertsDialogsPage,
  ) {}

  async dismissInfoDialogWithOk(): Promise<void> {
    await this.alertsDialogsPage.goto();
    await this.alertsDialogsPage.openInfoDialogButton.click();
    await this.alertsDialogsPage.infoDialogOkButton.click();
  }

  async closeInfoDialogWithX(): Promise<void> {
    await this.alertsDialogsPage.goto();
    await this.alertsDialogsPage.openInfoDialogButton.click();
    await this.alertsDialogsPage.infoDialogCloseButton.click();
  }

  async acceptConfirmDialog(): Promise<void> {
    await this.alertsDialogsPage.goto();
    await this.alertsDialogsPage.openConfirmDialogButton.click();
    await this.alertsDialogsPage.confirmOkButton.click();
  }

  async cancelConfirmDialog(): Promise<void> {
    await this.alertsDialogsPage.goto();
    await this.alertsDialogsPage.openConfirmDialogButton.click();
    await this.alertsDialogsPage.confirmCancelButton.click();
  }

  async stayOnUnsavedDialog(): Promise<void> {
    await this.alertsDialogsPage.goto();
    await this.alertsDialogsPage.openUnsavedDialogButton.click();
    await this.alertsDialogsPage.stayOnPageButton.click();
  }

  async cancelDeleteDialog(): Promise<void> {
    await this.alertsDialogsPage.goto();
    await this.alertsDialogsPage.openDeleteDialogButton.click();
    await this.alertsDialogsPage.deleteCancelButton.click();
  }

  async confirmDeleteDialog(): Promise<void> {
    await this.alertsDialogsPage.goto();
    await this.alertsDialogsPage.openDeleteDialogButton.click();
    await this.alertsDialogsPage.deleteConfirmButton.click();
  }

  async dismissBackdropDialog(): Promise<void> {
    await this.alertsDialogsPage.goto();
    await this.alertsDialogsPage.openBackdropDialogButton.click();
    await this.alertsDialogsPage.clickBackdropOutsideDialog();
  }

  async dismissEscapeDialog(): Promise<void> {
    await this.alertsDialogsPage.goto();
    await this.alertsDialogsPage.openEscapeDialogButton.click();
    await this.page.keyboard.press('Escape');
  }

  async acknowledgeNotificationDialog(): Promise<void> {
    await this.alertsDialogsPage.goto();
    await this.alertsDialogsPage.openNotificationDialogButton.click();
    await this.alertsDialogsPage.notificationAckButton.click();
  }

  // The dismiss button on a notification list item opens its own confirm
  // dialog rather than removing the item immediately — a naive single click
  // looks like a no-op unless that follow-up confirmation is also handled.
  async dismissNotification(notifId: string, label: string): Promise<void> {
    await this.alertsDialogsPage.notifDismissButton(notifId).click();
    await this.alertsDialogsPage.dismissConfirmButtonFor(label).click();
  }
}
