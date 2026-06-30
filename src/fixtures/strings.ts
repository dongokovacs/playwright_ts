// Expected page copy, in one place, so a real copy change on the site only
// breaks one file instead of forcing a grep through every test that asserts
// on it.

export const FormsPageText = {
  successHeading: 'Form Submitted Successfully!',
  successDetail: (firstName: string, lastName: string) =>
    `Hi ${firstName} ${lastName}, your details have been recorded.`,
  errors: {
    firstNameRequired: 'First name is required.',
    emailRequired: 'Email is required.',
    termsRequired: 'You must accept the terms.',
    passwordMismatch: 'Passwords do not match.',
    invalidEmail: 'Enter a valid email address.',
  },
} as const;

export const AlertsDialogsPageText = {
  simpleAlertMessage: 'Welcome to QA PlayGround!',
  confirmAccepted: 'Result: Accepted',
  confirmDismissed: 'Result: Dismissed',
  promptResult: (name: string) => `Your name is — ${name}`,
  toastMessage: 'This is simple toast.',
  sweetAlertTitle: 'Modern Alert',
} as const;
