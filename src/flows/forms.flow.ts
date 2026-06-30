import type { FormData, FormsPage } from '../pages/forms.page';

// The one named business use case on the Forms page: fill in every field
// with valid data and submit. Tests that deliberately submit a partial or
// broken form (missing fields, mismatched passwords) use FormsPage directly
// instead — those aren't "the happy-path flow", they're testing what
// happens when you don't follow it.
export class FormsFlow {
  constructor(private readonly formsPage: FormsPage) {}

  async submitValidForm(data: FormData): Promise<void> {
    await this.formsPage.goto();
    await this.formsPage.fillFirstName(data.firstName);
    await this.formsPage.fillLastName(data.lastName);
    await this.formsPage.fillEmail(data.email);
    await this.formsPage.fillPhone(data.phone);
    await this.formsPage.fillDob(data.dob);
    await this.formsPage.selectGender(data.gender);
    await this.formsPage.selectCountry(data.country);
    await this.formsPage.fillCity(data.city);

    for (const interest of data.interests ?? []) {
      await this.formsPage.toggleInterest(interest);
    }
    await this.formsPage.fillPassword(data.password);
    await this.formsPage.fillConfirmPassword(data.confirmPassword);
    await this.formsPage.acceptTerms();
    await this.formsPage.submit();
  }
}
