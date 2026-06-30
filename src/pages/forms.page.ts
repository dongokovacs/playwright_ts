import type { Locator, Page } from '@playwright/test';
import { HealingLocator } from '../core/healing-locator';

// Shorter than HealingLocator's default — the first strategy here is
// guaranteed to miss (see the class comment below), so there's no point
// waiting the full default before falling back.
const COUNTRY_TRIGGER_STRATEGY_TIMEOUT_MS = 1000;

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
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly dobInput: Locator;
  readonly cityInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly termsCheckbox: Locator;
  readonly submitButton: Locator;
  readonly successMessageText: Locator;
  readonly countryTrigger: Locator;
  /** Renamed test-id that doesn't exist on the live page — the primary, failing-on-purpose HealingLocator strategy. */
  readonly countryTriggerStale: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.getByTestId('input-first-name');
    this.lastNameInput = page.getByTestId('input-last-name');
    this.emailInput = page.getByTestId('input-email');
    this.phoneInput = page.getByTestId('input-phone');
    this.dobInput = page.getByTestId('input-dob');
    this.cityInput = page.getByTestId('input-city');
    this.passwordInput = page.getByTestId('input-password');
    this.confirmPasswordInput = page.getByTestId('input-confirm-password');
    this.termsCheckbox = page.getByTestId('checkbox-terms');
    this.submitButton = page.getByTestId('submit-form-btn');
    this.successMessageText = page.getByText('Form Submitted Successfully!');
    this.countryTrigger = page.getByTestId('select-country');
    this.countryTriggerStale = page.getByTestId('select-country-field');
  }

  async goto(): Promise<void> {
    await this.page.goto('forms');
  }

  async fill(data: FormData): Promise<void> {
    await this.fillFirstName(data.firstName);
    await this.fillLastName(data.lastName);
    await this.fillEmail(data.email);
    await this.fillPhone(data.phone);
    await this.fillDob(data.dob);
    await this.selectGender(data.gender);
    await this.selectCountry(data.country);
    await this.fillCity(data.city);

    for (const interest of data.interests ?? []) {
      await this.toggleInterest(interest);
    }
    await this.fillPassword(data.password);
    await this.fillConfirmPassword(data.confirmPassword);
  }

  async fillFirstName(value: string): Promise<void> {
    await this.firstNameInput.fill(value);
  }

  async fillLastName(value: string): Promise<void> {
    await this.lastNameInput.fill(value);
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPhone(value: string): Promise<void> {
    await this.phoneInput.fill(value);
  }

  async fillDob(value: string): Promise<void> {
    await this.dobInput.fill(value);
  }

  async selectGender(gender: GenderOption): Promise<void> {
    await this.page.getByTestId(`radio-gender-${gender}`).click({ force: true });
  }

  async selectCountry(country: string): Promise<void> {
    const trigger = await this.resolveCountryTrigger();
    await trigger.click();
    await this.page.getByRole('option', { name: country, exact: true }).click();
  }

  async fillCity(value: string): Promise<void> {
    await this.cityInput.fill(value);
  }

  async toggleInterest(interest: string): Promise<void> {
    await this.page.getByTestId(`checkbox-interest-${interest.toLowerCase()}`).click();
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(password: string): Promise<void> {
    await this.confirmPasswordInput.fill(password);
  }

  async acceptTerms(): Promise<void> {
    await this.termsCheckbox.click();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  successMessage(): Locator {
    return this.successMessageText;
  }

  /** field key matches the page's `error-<field>` data-testid suffix, e.g. "email", "confirm-password". */
  errorFor(field: string): Locator {
    return this.page.getByTestId(`error-${field}`);
  }

  private async resolveCountryTrigger(): Promise<Locator> {
    const healer = new HealingLocator(this.page, [
      { name: 'renamed-testid (intentionally stale)', locate: () => this.countryTriggerStale },
      { name: 'real data-testid', locate: () => this.countryTrigger },
    ]);
    const locator = await healer.resolve(COUNTRY_TRIGGER_STRATEGY_TIMEOUT_MS);
    const [healEvent] = healer.getHealLog();
    if (healEvent) {
      console.log(
        `[HealingLocator] healed via "${healEvent.strategyUsed}" after: ${healEvent.attemptedBefore.join(', ')}`,
      );
    }
    return locator;
  }
}
