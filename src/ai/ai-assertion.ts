import type { AIProvider } from './ai-provider';
import { attachAIExchange } from './attach-exchange';

export type SemanticMatchResult = {
  pass: boolean;
  reasoning: string;
};

/**
 * For when exact wording isn't fixed (locale, A/B copy, generated text) but
 * the meaning still needs checking. Conduit/QA Playground's own error texts
 * are stable, so those tests just use plain string assertions — this is
 * only for cases where that wouldn't work.
 */
export async function assertSemanticMatch(
  provider: AIProvider,
  actualText: string,
  expectedMeaning: string,
): Promise<SemanticMatchResult> {
  const prompt = [
    'You are a strict test-assertion engine. Decide whether the ACTUAL TEXT conveys the EXPECTED MEANING.',
    'Respond with ONLY a JSON object of the shape {"pass": boolean, "reasoning": string}. No markdown, no extra text.',
    '',
    `ACTUAL TEXT: ${JSON.stringify(actualText)}`,
    `EXPECTED MEANING: ${JSON.stringify(expectedMeaning)}`,
  ].join('\n');

  // temperature 0: a judge that can flip its verdict between runs on the
  // same input is a flaky test by construction.
  const raw = await provider.generateJson(prompt, { temperature: 0 });
  await attachAIExchange('semantic-assertion', prompt, raw);

  if (
    typeof raw === 'object' &&
    raw !== null &&
    'pass' in raw &&
    typeof (raw as Record<string, unknown>).pass === 'boolean'
  ) {
    const result = raw as { pass: boolean; reasoning?: unknown };
    return { pass: result.pass, reasoning: String(result.reasoning ?? '') };
  }

  throw new Error(`AI assertion returned an unexpected shape: ${JSON.stringify(raw)}`);
}
