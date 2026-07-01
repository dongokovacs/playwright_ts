import type { Locator, Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly feedHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.feedHeading = page.getByText('Your Feed');
  }
}
