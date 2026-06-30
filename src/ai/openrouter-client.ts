import type { AIProvider } from './ai-provider';

const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async generateText(prompt: string): Promise<string> {
    return this.complete(prompt);
  }

  async generateJson(prompt: string): Promise<unknown> {
    const text = await this.complete(prompt, { type: 'json_object' });
    return JSON.parse(text);
  }

  private async complete(
    prompt: string,
    responseFormat?: { type: 'json_object' },
  ): Promise<string> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        ...(responseFormat ? { response_format: responseFormat } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed (${response.status}): ${await response.text()}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? '';
  }
}

/**
 * Returns undefined (not a thrown error) when OPENROUTER_API_KEY is absent,
 * so call sites can skip AI-dependent tests with a clear reason instead of
 * failing the whole suite for contributors who haven't set up a key.
 */
export function createOpenRouterProviderFromEnv(): OpenRouterProvider | undefined {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return undefined;
  return new OpenRouterProvider(apiKey);
}
