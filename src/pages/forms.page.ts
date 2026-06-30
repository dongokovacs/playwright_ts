import type { Page } from '@playwright/test';
import { HealingLocator } from '../core/healing-locator';

export type GenderOption = 'male' | 'female' | 'other';

export type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: GenderOption;
  country: string;
  city: string;
  interests?: string[];
  password: string;
  confirmPassword: string;
};

// POM for the QA Playground "Forms" page — has enough interdependent fields
// and reuse across tests to be worth it (most other pages here don't).
//
// resolveCountryTrigger() below deliberately points its primary selector at
// a test-id that doesn't exist, so the fallback in HealingLocator actually
// has to do something. Not a bug — see ARCHITECTURE.md.
export class FormsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('forms');
  }

  async fill(data: FormData): Promise<void> {
    await this.page.locator('#firstName').fill(data.firstName);
    await this.page.locator('#lastName').fill(data.lastName);
    await this.page.locator('#email').fill(data.email);
    await this.page.locator('#phone').fill(data.phone);
    await this.page.locator('#dob').fill(data.dob);
    await this.page.locator(`#gender-${data.gender}`).click({ force: true });

    const countryTrigger = await this.resolveCountryTrigger();
    await countryTrigger.click();
    await this.page.getByRole('option', { name: data.country, exact: true }).click();

    await this.page.locator('#city').fill(data.city);

    for (const interest of data.interests ?? []) {
      await this.page.getByTestId(`checkbox-interest-${interest.toLowerCase()}`).click();
    }
    await this.page.locator('#password').fill(data.password);
    await this.page.locator('#confirmPassword').fill(data.confirmPassword);
  }

  async acceptTerms(): Promise<void> {
    await this.page.getByTestId('checkbox-terms').click();
  }

  async submit(): Promise<void> {
    await this.page.getByTestId('submit-form-btn').click();
  }

  successMessage() {
    return this.page.getByText('Form Submitted Successfully!');
  }

  /** field key matches the page's `error-<field>` data-testid suffix, e.g. "email", "confirm-password". */
  errorFor(field: string) {
    return this.page.getByTestId(`error-${field}`);
  }

  private async resolveCountryTrigger() {
    const healer = new HealingLocator(this.page, [
      {
        name: 'renamed-testid (intentionally stale)',
        locate: (p) => p.getByTestId('select-country-field'),
      },
      { name: 'real data-testid', locate: (p) => p.getByTestId('select-country') },
    ]);
    const locator = await healer.resolve(1000);
    const [healEvent] = healer.getHealLog();
    if (healEvent) {
      console.log(
        `[HealingLocator] healed via "${healEvent.strategyUsed}" after: ${healEvent.attemptedBefore.join(', ')}`,
      );
    }
    return locator;
  }
}
