// @ts-check
const tseslint = require('typescript-eslint');
const js = require('@eslint/js');

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'],
  },
  {
    files: ['eslint.config.js', 'scripts/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['src/fixtures/**/*.ts'],
    rules: {
      // Playwright fixtures require the `{}` first-arg destructure when a
      // fixture doesn't depend on any other fixture.
      'no-empty-pattern': 'off',
    },
  },
  {
    // Every page used in tests/ has a Page Object now (forms.page.ts,
    // alerts-dialogs.page.ts, conduit-article.page.ts). page.locator() in a
    // spec file means either bypassing one that exists, or a new page that
    // showed up without one — both are worth a second look, not a silent
    // pass.
    files: ['tests/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='locator']",
          message:
            'page.locator() in a spec file — use a Page Object method instead. If no Page Object exists for this page yet, add one rather than reaching for a raw locator here.',
        },
      ],
      // "Tests only import from src/fixtures (plus src/utils and
      // src/api/schemas)" used to be a written rule only — and a spec
      // importing straight from src/ai/ got in anyway. Now it's checked.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              message:
                'Import test/expect from src/fixtures — the custom matchers and fixtures live there.',
            },
          ],
          patterns: [
            {
              // A deny-list, not "src/** except …": gitignore-style
              // negation can't re-include a path under an excluded dir.
              group: [
                '**/src/ai/**',
                '**/src/config/**',
                '**/src/core/**',
                '**/src/expects/**',
                '**/src/flows/**',
                '**/src/pages/**',
                '**/src/api/*.client',
                '**/src/api/request-handler',
                '**/src/fixtures/*',
              ],
              message:
                'Specs import from src/fixtures (plus src/utils and src/api/schemas) only. Need something else? Expose it through a fixture.',
            },
          ],
        },
      ],
    },
  },
);
