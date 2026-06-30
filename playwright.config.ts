import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

// after dotenv.config() — env.ts reads process.env at import time
import { CONDUIT_API_URL, CONDUIT_UI_URL } from './src/config/env';

const QA_PLAYGROUND_URL = 'https://qaplayground.com/practice/';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [
        ['html', { open: 'never' }],
        ['list'],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ]
    : [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: CONDUIT_API_URL,
      },
    },
    {
      name: 'ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: QA_PLAYGROUND_URL,
      },
    },
    {
      name: 'hybrid',
      testDir: './tests/hybrid',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: CONDUIT_UI_URL,
      },
    },
  ],
});
