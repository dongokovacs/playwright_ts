import type { ZodType, z } from 'zod';
import type { AIProvider } from './ai-provider';

// Turns a plain-English instruction into a JSON object and validates it
// against the schema before returning. If the model returns garbage, this
// throws instead of passing it along.
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
