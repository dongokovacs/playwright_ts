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
 * Wraps an ordered list of locator strategies for the same logical element.
 * The first strategy is the "intended" selector; the rest are fallbacks that
 * only get tried if the previous one fails to become visible in time.
 *
 * This is a deliberately simple, deterministic heuristic healer (no AI call,
 * no DOM-wide search) — fast, free, and the healing reason is always
 * inspectable via getHealLog(). See ARCHITECTURE.md for why this approach
 * was chosen over an LLM-based healer.
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
