/**
 * Everything in src/ai/ goes through this, never a provider SDK directly.
 * Swapping providers later means writing one new class, not touching tests.
 */
export type GenerateOptions = {
  /**
   * 0 for anything that judges (assertions) — the same input should get the
   * same verdict on every run. Leave unset for generation where variety is
   * fine (test data), so the provider's default applies.
   */
  temperature?: number;
};

export interface AIProvider {
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  generateJson(prompt: string, options?: GenerateOptions): Promise<unknown>;
}
