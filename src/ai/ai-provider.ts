/**
 * Everything in src/ai/ goes through this, never a provider SDK directly.
 * Swapping providers later means writing one new class, not touching tests.
 */
export interface AIProvider {
  generateText(prompt: string): Promise<string>;
  generateJson(prompt: string): Promise<unknown>;
}
