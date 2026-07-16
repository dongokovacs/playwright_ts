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
    },
  },
);
