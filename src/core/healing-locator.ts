import type { Locator, Page } from '@playwright/test';

export type LocatorStrategy = {
  name: string;
  locate: (page: Page) => Locator;
};

export type HealEvent = {
  timestamp: string;
  strategyUsed: string;
  attemptedBefore: string[];
};

/**
 * Tries a list of locator strategies in order for the same element. First
 * one that resolves in time wins; if it's not the first strategy, that gets
 * logged so you can see what actually healed (see getHealLog()).
 *
 * No AI here, on purpose — see ARCHITECTURE.md for the reasoning.
 */
export class HealingLocator {
  private readonly healLog: HealEvent[] = [];

  constructor(
    private readonly page: Page,
    private readonly strategies: LocatorStrategy[],
  ) {
    if (strategies.length === 0) {
      throw new Error('HealingLocator requires at least one strategy');
    }
  }

  async resolve(timeoutPerStrategyMs = 2000): Promise<Locator> {
    const attempted: string[] = [];

    for (const strategy of this.strategies) {
      const locator = strategy.locate(this.page);
      try {
        await locator.first().waitFor({ state: 'visible', timeout: timeoutPerStrategyMs });
        if (attempted.length > 0) {
          this.healLog.push({
            timestamp: new Date().toISOString(),
            strategyUsed: strategy.name,
            attemptedBefore: [...attempted],
          });
        }
        return locator;
      } catch {
        attempted.push(strategy.name);
      }
    }

    throw new Error(
      `HealingLocator: no strategy matched. Tried in order: ${this.strategies.map((s) => s.name).join(' -> ')}`,
    );
  }

  getHealLog(): readonly HealEvent[] {
    return this.healLog;
  }
}
