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

/**
 * Page Object for the QA Playground "Forms" practice page — justified here
 * because the flow has many interdependent fields and is reused across both
 * the happy-path and validation test cases.
 *
 * The country selector intentionally goes through HealingLocator: its
 * primary strategy targets a renamed data-testid ("select-country-field")
 * that doesn't exist on the live page, to demonstrate the fallback path
 * actually kicking in and resolving to the real trigger button. See
 * ARCHITECTURE.md for why this is a deliberate demo rather than a flaky
 * selector left in by accident.
 */
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
