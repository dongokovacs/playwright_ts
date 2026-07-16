// Expected page copy, in one place, so a real copy change on the site only
// breaks one file instead of forcing a grep through every test that asserts
// on it.

export const FormsPageText = {
  // The account-setup form (F05) is the last step of the multi-form flow and
  // its completion banner is what "the form was submitted" means on this
  // page now — see forms.page.ts for why the page is 5 independent forms.
  successHeading: 'Account Setup Complete!',
  successDetail: (firstName: string, lastName: string) => `Saved: ${firstName} ${lastName}`,
  errors: {
    firstNameRequired: 'First name is required.',
    emailRequired: 'Email is required.',
    termsRequired: 'You must accept the Terms & Conditions.',
    passwordMismatch: 'Passwords do not match.',
    invalidEmail: 'Enter a valid email address.',
  },
} as const;

export const AlertsDialogsPageText = {
  infoDialogTitle: 'Session Notice',
  infoDialogBody:
    'Your session will expire in 30 minutes. Please save your work before the session ends.',
  infoDismissed: 'Info dialog dismissed',
  confirmDialogTitle: 'Confirm Submission',
  confirmAccepted: 'Submission confirmed!',
  confirmAwaiting: 'Awaiting confirmation',
  unsavedDialogTitle: 'Unsaved Changes',
  unsavedAwaiting: 'Dialog not opened',
  stayedResult: 'Stayed — changes preserved',
  deleteDialogTitle: 'Delete Account',
  deleteEmail: 'user@example.com',
  deleteAwaiting: 'No deletion yet',
  deleteConfirmed: 'Account deleted!',
  backdropDialogTitle: 'Dismiss by Clicking Outside',
  backdropDismissed: 'Dialog closed via backdrop',
  escapeDialogTitle: 'Press Escape to Close',
  escapeDismissed: 'Dialog closed via Escape key',
  notificationDialogTitle: 'Maintenance Window',
  notificationBody:
    'Service will be offline from Sunday 3:00–5:00 AM UTC. Please plan accordingly and save any active work before the window begins.',
  notificationAwaiting: 'Awaiting acknowledgement',
  notificationAcknowledged: 'Notification acknowledged',
  notifDismissedResult: (label: string) => `${label} — notification dismissed`,
} as const;
