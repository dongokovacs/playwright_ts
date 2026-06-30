import { expect, test } from '../../src/fixtures/page.fixtures';
import { AlertsDialogsPageText } from '../../src/fixtures/strings';

test.describe('Alerts & Dialogs practice page', () => {
  test('accepts a simple browser alert and reads its message @smoke', async ({
    alertsDialogsFlow,
  }) => {
    const message = await alertsDialogsFlow.triggerSimpleAlertAndCaptureMessage();

    expect(message).toBe(AlertsDialogsPageText.simpleAlertMessage);
  });

  test('accepting the confirm dialog records an Accepted result', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsFlow.respondToConfirm(true);

    await expect(alertsDialogsPage.confirmAcceptedResult).toBeVisible();
  });

  test('dismissing the confirm dialog records a Dismissed result', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsFlow.respondToConfirm(false);

    await expect(alertsDialogsPage.confirmDismissedResult).toBeVisible();
  });

  test('typed prompt input is captured after accepting', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsFlow.submitPrompt('healing-locator-demo');

    await expect(alertsDialogsPage.promptResult('healing-locator-demo')).toBeVisible();
  });

  test('toast alert renders a [data-sonner-toast] element @smoke', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsFlow.triggerToast();

    await expect(alertsDialogsPage.toast).toBeVisible();
    await expect(alertsDialogsPage.toast).toContainText(AlertsDialogsPageText.toastMessage);
  });

  test('sweet alert modal shows its title and can be closed', async ({
    alertsDialogsPage,
    alertsDialogsFlow,
  }) => {
    await alertsDialogsFlow.openSweetAlert();

    await expect(alertsDialogsPage.modal).toContainText(AlertsDialogsPageText.sweetAlertTitle);

    await alertsDialogsPage.closeSweetAlert();
    await expect(alertsDialogsPage.modal).toBeHidden();
  });

  test('has no detectable accessibility violations @a11y', async ({ alertsDialogsPage, a11y }) => {
    await alertsDialogsPage.goto();

    const results = await a11y.analyze();

    // QA Playground is a third-party demo site; pre-existing there, not
    // something this suite can fix. Tracked as a known baseline so the test
    // still catches anything new instead of being all-or-nothing.
    const knownIssues = ['color-contrast'];
    expect(results).shouldHaveNoA11yViolations(knownIssues);
  });
});
