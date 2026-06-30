import type { AIProvider } from './ai-provider';

export type SemanticMatchResult = {
  pass: boolean;
  reasoning: string;
};

/**
 * Use this for assertions where the exact wording of UI/API text is
 * non-deterministic (varies by locale, A/B copy test, or LLM-generated
 * content) but the *meaning* must hold — e.g. "this is some flavor of an
 * 'invalid email' error" rather than a brittle exact-string match.
 *
 * Deliberately not used for the deterministic Conduit/QA Playground error
 * messages elsewhere in this repo — those have stable, known text, so a
 * plain string assertion is faster, free, and more precise. This is the
 * tool for the cases a plain assertion can't handle.
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

  const raw = await provider.generateJson(prompt);

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
