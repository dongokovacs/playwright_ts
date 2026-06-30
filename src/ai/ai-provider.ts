/**
 * Everything in src/ai/ talks to this interface, never to a provider SDK
 * directly (Dependency Inversion). Swapping providers later only means
 * writing one new class here — no test or fixture changes required.
 */
export interface AIProvider {
  generateText(prompt: string): Promise<string>;
  generateJson(prompt: string): Promise<unknown>;
}
