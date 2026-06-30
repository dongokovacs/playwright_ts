import { assertSemanticMatch } from '../../src/ai/ai-assertion';
import { createOpenRouterProviderFromEnv } from '../../src/ai/openrouter-client';
import { generateTestData } from '../../src/ai/test-data-generator';
import { test, expect } from '../../src/fixtures';
import { ArticleDraftSchema } from '../../src/api/schemas/article.schema';
import { buildArticlePayload } from '../../src/utils/data-factory';

const aiProvider = createOpenRouterProviderFromEnv();

/**
 * Demonstrates the full hybrid + AI flow: an LLM drafts article content,
 * the API creates it, the UI renders it, and (when a key is configured) an
 * LLM-based semantic assertion checks the rendered body actually matches
 * the intended topic — useful for content whose exact wording isn't fixed.
 *
 * This test never gets skipped: without OPENROUTER_API_KEY it falls back to a
 * faker-built draft and simply omits the semantic check, so the
 * deterministic API+UI assertions still run and report on every PR/CI run.
 * Only the bonus AI step is conditional on the secret being present.
 */
test.describe('Hybrid + AI: AI-drafted article lifecycle', () => {
  test('AI-drafted (or faker-fallback) article renders correctly and matches its intended topic', async ({
    page,
    articlesApi,
  }) => {
    const topic =
      'a short, upbeat article about why Playwright is great for end-to-end test automation';
    const draft = aiProvider
      ? await generateTestData(
          aiProvider,
          ArticleDraftSchema,
          [
            `Write ${topic}.`,
            'The JSON object must have exactly these keys: "title" (string), "description" (string, a one-sentence summary),',
            '"body" (string, the full article text), "tagList" (array of 1-3 short lowercase string tags, e.g. ["playwright"]).',
          ].join(' '),
        )
      : buildArticlePayload();

    const created = await articlesApi.create(draft);
    const slug = created.article.slug;

    await page.goto(`article/${slug}`);
    await expect(page.getByRole('heading', { level: 1, name: draft.title })).toBeVisible();

    console.log(draft);

    if (aiProvider) {
      // Wait for the real body to be painted (not just the heading/tag
      // chips) before reading it back out, to avoid a race against the
      // SPA's content fetch.
      const articleContent = page.locator('.article-content');
      await expect(articleContent).toContainText(draft.body.slice(0, 25));
      const renderedBody = await articleContent.innerText();
      const semanticCheck = await assertSemanticMatch(aiProvider, renderedBody, topic);
      expect(semanticCheck.pass, semanticCheck.reasoning).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: 'skipped-step',
        description:
          'AI draft + semantic assertion skipped: OPENROUTER_API_KEY not set, used faker fallback instead',
      });
    }

    await articlesApi.delete(slug);
  });
});
