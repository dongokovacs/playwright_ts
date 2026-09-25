import { test } from '@playwright/test';

// Attaches an LLM prompt/response pair to the current test's report, so a
// red (or suspiciously green) AI-backed test can be audited from the HTML
// report alone — what was asked, what came back — without a local re-run.
// A no-op outside a running test, where test.info() throws.
export async function attachAIExchange(
  name: string,
  prompt: string,
  response: unknown,
): Promise<void> {
  let info: ReturnType<typeof test.info>;
  try {
    info = test.info();
  } catch {
    return;
  }
  await info.attach(`ai-${name}`, {
    body: JSON.stringify({ prompt, response }, null, 2),
    contentType: 'application/json',
  });
}
