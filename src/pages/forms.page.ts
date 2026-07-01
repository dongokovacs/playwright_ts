import type { Locator, Page } from '@playwright/test';
import { HealingLocator } from '../core/healing-locator';
import { FormsPageText } from '../fixtures/strings';

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

// POM for the QA Playground "Forms" page — public locators for callers to
// act on directly, plus the actions that need real logic: dynamic selector
// construction (selectGender, toggleInterest) or multiple steps
// (selectCountry). The multi-step "fill the whole form and submit" business
// flow lives in flows/forms.flow.ts instead of here; see ARCHITECTURE.md for
// why that's a separate layer.
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
  readonly successMessage: Locator;
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
    this.successMessage = page.getByText(FormsPageText.successHeading);
    this.countryTrigger = page.getByTestId('select-country');
    this.countryTriggerStale = page.getByTestId('select-country-field');
  }

  async goto(): Promise<void> {
    await this.page.goto('forms');
  }

  async selectGender(gender: GenderOption): Promise<void> {
    await this.page.getByTestId(`radio-gender-${gender}`).click({ force: true });
  }

  async selectCountry(country: string): Promise<void> {
    const trigger = await this.resolveCountryTrigger();
    await trigger.click();
    await this.page.getByRole('option', { name: country, exact: true }).click();
  }

  async toggleInterest(interest: string): Promise<void> {
    await this.page.getByTestId(`checkbox-interest-${interest.toLowerCase()}`).click();
  }

  successDetail(firstName: string, lastName: string): Locator {
    return this.page.getByText(FormsPageText.successDetail(firstName, lastName));
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
