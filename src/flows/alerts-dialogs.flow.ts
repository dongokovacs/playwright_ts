import type { Page } from '@playwright/test';
import type { AlertsDialogsPage } from '../pages/alerts-dialogs.page';

// One named use case per dialog scenario.
//
// The dialog must be accepted/dismissed *inside* the page.once('dialog', ...)
// handler itself, not in code that runs after awaiting the click that opens
// it. A native dialog blocks the page synchronously, so the click's own
// action-wait can depend on the dialog being handled — if that handling is
// deferred to after `await click()`, it never happens and the click hangs.
// The handler firing is independent of whether click() has resolved yet, so
// doing the accept/dismiss inside it works regardless.
export class AlertsDialogsFlow {
  constructor(
    private readonly page: Page,
    private readonly alertsDialogsPage: AlertsDialogsPage,
  ) {}

  async triggerSimpleAlertAndCaptureMessage(): Promise<string> {
    await this.alertsDialogsPage.goto();
    const result = new Promise<string>((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });
    await this.alertsDialogsPage.simpleAlertButton.click();
    return result;
  }

  async respondToConfirm(accept: boolean): Promise<void> {
    await this.alertsDialogsPage.goto();
    const handled = new Promise<void>((resolve) => {
      this.page.once('dialog', async (dialog) => {
        if (accept) {
          await dialog.accept();
        } else {
          await dialog.dismiss();
        }
        resolve();
      });
    });
    await this.alertsDialogsPage.confirmAlertButton.click();
    await handled;
  }

  async submitPrompt(text: string): Promise<void> {
    await this.alertsDialogsPage.goto();
    const handled = new Promise<void>((resolve) => {
      this.page.once('dialog', async (dialog) => {
        await dialog.accept(text);
        resolve();
      });
    });
    await this.alertsDialogsPage.promptAlertButton.click();
    await handled;
  }

  async triggerToast(): Promise<void> {
    await this.alertsDialogsPage.goto();
    await this.alertsDialogsPage.toastAlertButton.click();
  }

  async openSweetAlert(): Promise<void> {
    await this.alertsDialogsPage.goto();
    await this.alertsDialogsPage.sweetAlertButton.click();
  }
}
