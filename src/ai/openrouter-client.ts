import type { AIProvider, GenerateOptions } from './ai-provider';

const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Per attempt. Kept well under Playwright's 30s default test timeout, so a
// stalled provider surfaces as a clear "OpenRouter timed out" error instead
// of a generic test timeout with no hint of where it hung.
const REQUEST_TIMEOUT_MS = 20_000;
// Only rate limits and server errors are retried — a timeout isn't (another
// 20s attempt would just run into the test timeout), and a 4xx won't change.
const MAX_RETRIES = 1;
const RETRY_BACKOFF_MS = 1_000;

export class OpenRouterProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    return this.complete(prompt, options);
  }

  async generateJson(prompt: string, options?: GenerateOptions): Promise<unknown> {
    const text = await this.complete(prompt, options, { type: 'json_object' });
    // json_object mode is supposed to rule out fences, but not every model
    // routed through OpenRouter honors it.
    const unfenced = text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');
    try {
      return JSON.parse(unfenced);
    } catch {
      throw new Error(`OpenRouter (${this.model}) returned non-JSON content: ${text}`);
    }
  }

  private async complete(
    prompt: string,
    options: GenerateOptions = {},
    responseFormat?: { type: 'json_object' },
  ): Promise<string> {
    const body = JSON.stringify({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(responseFormat ? { response_format: responseFormat } : {}),
    });

    for (let attempt = 0; ; attempt++) {
      let response: Response;
      try {
        response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
          throw new Error(`OpenRouter request timed out after ${REQUEST_TIMEOUT_MS}ms`, {
            cause: error,
          });
        }
        throw error;
      }

      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS * (attempt + 1)));
        continue;
      }

      if (!response.ok) {
        throw new Error(`OpenRouter request failed (${response.status}): ${await response.text()}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return data.choices?.[0]?.message?.content ?? '';
    }
  }
}

// Returns undefined instead of throwing when there's no key configured —
// callers fall back to non-AI behavior instead of failing outright.
export function createOpenRouterProviderFromEnv(): OpenRouterProvider | undefined {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return undefined;
  return new OpenRouterProvider(apiKey);
}
