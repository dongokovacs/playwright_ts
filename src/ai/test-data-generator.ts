import type { ZodType, z } from 'zod';
import type { AIProvider } from './ai-provider';

/**
 * Generates a single JSON object from a natural-language instruction and
 * validates it against the given Zod schema before returning. Zod stays the
 * single source of truth for shape/type — if the model returns something
 * that doesn't fit, this throws instead of silently handing back bad data.
 */
export async function generateTestData<TSchema extends ZodType>(
  provider: AIProvider,
  schema: TSchema,
  instructions: string,
): Promise<z.infer<TSchema>> {
  const prompt = [
    `Generate a single JSON object for this test data request: ${instructions}`,
    'Respond with ONLY the JSON object — no markdown fences, no commentary.',
  ].join('\n');

  const raw = await provider.generateJson(prompt);
  const result = schema.safeParse(raw);

  if (!result.success) {
    throw new Error(
      `AI-generated test data failed schema validation.\nIssues: ${JSON.stringify(result.error.issues, null, 2)}\nRaw response: ${JSON.stringify(raw)}`,
    );
  }

  return result.data;
}
