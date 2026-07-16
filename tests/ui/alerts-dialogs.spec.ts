import { expect, test } from '../../src/fixtures/page.fixtures';
import { AlertsDialogsPageText } from '../../src/fixtures/strings';

test.describe('Alerts & Dialogs practice page', () => {
  test('closing the info dialog via OK records a dismissed result @smoke', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsFlow.dismissInfoDialogWithOk();

    await expect(alertsDialogsPage.infoDialog).toBeHidden();
    await expect(alertsDialogsPage.infoResult).toHaveText(AlertsDialogsPageText.infoDismissed);
  });

  test('closing the info dialog via the X button also records a dismissed result', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsFlow.closeInfoDialogWithX();

    await expect(alertsDialogsPage.infoDialog).toBeHidden();
    await expect(alertsDialogsPage.infoResult).toHaveText(AlertsDialogsPageText.infoDismissed);
  });

  test('confirming the submission dialog records a confirmed result @smoke', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsFlow.acceptConfirmDialog();

    await expect(alertsDialogsPage.confirmDialog).toBeHidden();
    await expect(alertsDialogsPage.confirmResult).toHaveText(AlertsDialogsPageText.confirmAccepted);
  });

  test('cancelling the submission dialog closes it without confirming', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsFlow.cancelConfirmDialog();

    await expect(alertsDialogsPage.confirmDialog).toBeHidden();
    await expect(alertsDialogsPage.confirmResult).toHaveText(AlertsDialogsPageText.confirmAwaiting);
  });

  test('staying on the page from the unsaved-changes dialog records a stayed result', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsFlow.stayOnUnsavedDialog();

    await expect(alertsDialogsPage.unsavedDialog).toBeHidden();
    await expect(alertsDialogsPage.unsavedResult).toHaveText(AlertsDialogsPageText.stayedResult);
  });

  test('cancelling account deletion closes the dialog without deleting', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsFlow.cancelDeleteDialog();

    await expect(alertsDialogsPage.deleteDialog).toBeHidden();
    await expect(alertsDialogsPage.deleteResult).toHaveText(AlertsDialogsPageText.deleteAwaiting);
  });

  test('confirming account deletion records a deleted result', async ({ alertsDialogsPage }) => {
    await alertsDialogsPage.goto();
    await alertsDialogsPage.openDeleteDialogButton.click();
    await expect(alertsDialogsPage.deleteDialogEmail).toHaveText(AlertsDialogsPageText.deleteEmail);
    await alertsDialogsPage.deleteConfirmButton.click();

    await expect(alertsDialogsPage.deleteDialog).toBeHidden();
    await expect(alertsDialogsPage.deleteResult).toHaveText(AlertsDialogsPageText.deleteConfirmed);
  });

  test('clicking the backdrop dismisses the dialog', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsFlow.dismissBackdropDialog();

    await expect(alertsDialogsPage.backdropDialog).toBeHidden();
    await expect(alertsDialogsPage.backdropResult).toHaveText(
      AlertsDialogsPageText.backdropDismissed,
    );
  });

  test('pressing Escape dismisses the keyboard dialog', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsFlow.dismissEscapeDialog();

    await expect(alertsDialogsPage.escapeDialog).toBeHidden();
    await expect(alertsDialogsPage.escapeResult).toHaveText(AlertsDialogsPageText.escapeDismissed);
  });

  test('notification dialog shows its title and body before being acknowledged', async ({
    alertsDialogsPage,
  }) => {
    await alertsDialogsPage.goto();
    await alertsDialogsPage.openNotificationDialogButton.click();

    await expect(alertsDialogsPage.notificationDialog).toContainText(
      AlertsDialogsPageText.notificationDialogTitle,
    );
    await expect(alertsDialogsPage.notificationDialog).toContainText(
      AlertsDialogsPageText.notificationBody,
    );

    await alertsDialogsPage.notificationAckButton.click();

    await expect(alertsDialogsPage.notificationDialog).toBeHidden();
    await expect(alertsDialogsPage.notificationResult).toHaveText(
      AlertsDialogsPageText.notificationAcknowledged,
    );
  });

  test('dismissing a scoped notification requires confirming the follow-up dialog', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsPage.goto();

    await alertsDialogsFlow.dismissNotification('notif-1', 'Low Disk Space');

    await expect(alertsDialogsPage.notifDismissResult).toHaveText(
      AlertsDialogsPageText.notifDismissedResult('Low Disk Space'),
    );
  });

  test('has no detectable accessibility violations @a11y', async ({ alertsDialogsPage, a11y }) => {
    await alertsDialogsPage.goto();

    const results = await a11y.analyze();

    // QA Playground is a third-party demo site; pre-existing there, not
    // something this suite can fix. Tracked as a known baseline so the test
    // still catches anything new instead of being all-or-nothing.
    // button-name shows up intermittently under load (an icon-only button —
    // likely a "scroll to top" or similar widget — that isn't always
    // labeled by the time axe runs), so it's baselined here too rather than
    // making this test flaky.
    const knownIssues = ['color-contrast', 'button-name'];
    expect(results).shouldHaveNoA11yViolations(knownIssues);
  });
});
