import type { Locator, Page } from '@playwright/test';

// Conduit doesn't expose data-testid attributes (it's a real third-party
// app, not built for this portfolio), so `.article-content` is a CSS class
// selector rather than a test-id — the only selector actually available.
export class ConduitArticlePage {
  readonly page: Page;
  readonly content: Locator;

  constructor(page: Page) {
    this.page = page;
    this.content = page.locator('.article-content');
  }

  async goto(slug: string): Promise<void> {
    await this.page.goto(`article/${slug}`);
  }

  heading(title: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: title });
  }
}
