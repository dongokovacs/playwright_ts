import type { Locator, Page } from '@playwright/test';

export class AlertsDialogsPage {
  readonly page: Page;

  readonly openInfoDialogButton: Locator;
  readonly infoDialog: Locator;
  readonly infoDialogOkButton: Locator;
  readonly infoDialogCloseButton: Locator;
  readonly infoResult: Locator;

  readonly openConfirmDialogButton: Locator;
  readonly confirmDialog: Locator;
  readonly confirmOkButton: Locator;
  readonly confirmCancelButton: Locator;
  readonly confirmResult: Locator;

  readonly openUnsavedDialogButton: Locator;
  readonly unsavedDialog: Locator;
  readonly stayOnPageButton: Locator;
  readonly unsavedResult: Locator;

  readonly openDeleteDialogButton: Locator;
  readonly deleteDialog: Locator;
  readonly deleteDialogEmail: Locator;
  readonly deleteCancelButton: Locator;
  readonly deleteConfirmButton: Locator;
  readonly deleteResult: Locator;

  readonly openBackdropDialogButton: Locator;
  readonly backdropDialog: Locator;
  readonly backdropResult: Locator;

  readonly openEscapeDialogButton: Locator;
  readonly escapeDialog: Locator;
  readonly escapeResult: Locator;

  readonly openNotificationDialogButton: Locator;
  readonly notificationDialog: Locator;
  readonly notificationAckButton: Locator;
  readonly notificationResult: Locator;

  readonly notifItems: Locator;
  readonly dismissConfirmDialog: Locator;
  readonly dismissCancelButton: Locator;
  readonly notifDismissResult: Locator;

  constructor(page: Page) {
    this.page = page;

    this.openInfoDialogButton = page.getByTestId('open-info-dialog');
    this.infoDialog = page.getByTestId('info-alert-dialog');
    this.infoDialogOkButton = page.getByTestId('info-dialog-ok-btn');
    this.infoDialogCloseButton = page.getByTestId('info-dialog-close-btn');
    this.infoResult = page.getByTestId('result-s01');

    this.openConfirmDialogButton = page.getByTestId('open-confirm-dialog');
    this.confirmDialog = page.getByTestId('confirm-action-dialog');
    this.confirmOkButton = page.getByTestId('confirm-ok-btn');
    this.confirmCancelButton = page.getByTestId('confirm-cancel-btn');
    this.confirmResult = page.getByTestId('result-s02');

    this.openUnsavedDialogButton = page.getByTestId('open-unsaved-dialog');
    this.unsavedDialog = page.getByTestId('unsaved-changes-dialog');
    this.stayOnPageButton = page.getByTestId('stay-on-page-btn');
    this.unsavedResult = page.getByTestId('result-s03');

    this.openDeleteDialogButton = page.getByTestId('open-delete-dialog');
    this.deleteDialog = page.getByTestId('delete-account-dialog');
    this.deleteDialogEmail = page.getByTestId('delete-dialog-email');
    this.deleteCancelButton = page.getByTestId('delete-cancel-btn');
    // No test-id on the destructive action itself — only an aria-label.
    this.deleteConfirmButton = page.getByRole('button', { name: 'Confirm account deletion' });
    this.deleteResult = page.getByTestId('result-s04');

    this.openBackdropDialogButton = page.getByTestId('open-backdrop-dialog');
    this.backdropDialog = page.getByTestId('backdrop-dismiss-dialog');
    this.backdropResult = page.getByTestId('result-s05');

    this.openEscapeDialogButton = page.getByTestId('open-escape-dialog');
    this.escapeDialog = page.getByTestId('escape-dismiss-dialog');
    this.escapeResult = page.getByTestId('result-s06');

    this.openNotificationDialogButton = page.getByTestId('open-notification-dialog');
    this.notificationDialog = page.getByTestId('system-notification-dialog');
    this.notificationAckButton = page.getByTestId('notif-ack-btn');
    this.notificationResult = page.getByTestId('result-s07');

    this.notifItems = page.getByTestId('notif-item');
    this.dismissConfirmDialog = page.getByTestId('dismiss-confirm-dialog');
    this.dismissCancelButton = page.getByTestId('dismiss-cancel-btn');
    this.notifDismissResult = page.getByTestId('result-s08');
  }

  async goto(): Promise<void> {
    await this.page.goto('alerts-dialogs');
  }

  notifItem(notifId: string): Locator {
    return this.page.locator(`[data-testid="notif-item"][data-notif-id="${notifId}"]`);
  }

  notifDismissButton(notifId: string): Locator {
    return this.notifItem(notifId).getByTestId('notif-dismiss-btn');
  }

  dismissConfirmButtonFor(label: string): Locator {
    return this.page.getByRole('button', { name: `Confirm dismiss ${label}` });
  }

  // The backdrop dialog has no close button — the overlay area itself
  // dismisses it, and the site nav overlaps the top of the viewport, so the
  // click must land away from both the dialog box and the nav.
  async clickBackdropOutsideDialog(): Promise<void> {
    const box = await this.backdropDialog.boundingBox();
    if (!box) throw new Error('Backdrop dialog is not visible');
    await this.backdropDialog.click({ position: { x: 5, y: box.height - 5 }, force: true });
  }
}
