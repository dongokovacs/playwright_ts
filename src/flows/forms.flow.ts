import type { FormData, FormsPage } from '../pages/forms.page';

// The named business use case on the Forms page: fill in every field with
// valid data (fillValidForm), then submit (submitForm) — kept separate so a
// caller that only wants a filled-in form doesn't have to submit it. Tests
// that deliberately submit a partial or broken form (missing fields,
// mismatched passwords) use FormsPage directly instead — those aren't "the
// happy-path flow", they're testing what happens when you don't follow it.
export class FormsFlow {
  constructor(private readonly formsPage: FormsPage) {}

  async fillValidForm(data: FormData): Promise<void> {
    await this.formsPage.goto();
    await this.formsPage.firstNameInput.fill(data.firstName);
    await this.formsPage.lastNameInput.fill(data.lastName);
    await this.formsPage.emailInput.fill(data.email);
    await this.formsPage.phoneInput.fill(data.phone);
    await this.formsPage.dobInput.fill(data.dob);
    await this.formsPage.selectGender(data.gender);
    await this.formsPage.selectCountry(data.country);
    await this.formsPage.cityInput.fill(data.city);

    for (const interest of data.interests ?? []) {
      await this.formsPage.toggleInterest(interest);
    }
    await this.formsPage.passwordInput.fill(data.password);
    await this.formsPage.confirmPasswordInput.fill(data.confirmPassword);
    await this.formsPage.termsCheckbox.click();
  }

  async submitForm(): Promise<void> {
    await this.formsPage.submitButton.click();
  }
}
