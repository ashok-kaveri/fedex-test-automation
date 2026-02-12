import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

export default defineConfig({
  testDir: './tests',

  /* Run tests sequentially */
  fullyParallel: false,
  workers: 1,

  /* CI safety */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  /* Reporters */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright-report', open: 'always' }],
    ['playwright-smart-reporter'],
    ['./reports/slack-report/slack-reporter.ts'],
    ['./reports/smart-report/open-smart-report.ts'],
  ],

  /* Shared settings */
  use: {
    trace: 'on-first-retry',

    launchOptions: {
      args: ['--disable-blink-features=AutomationControlled'],
    },

    viewport: { width: 1400, height: 1000 },
  },

  /* Projects */
  projects: [
    {
      name: 'Google Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1400, height: 1000 },
      },
    },
    {
      name: 'Safari',
      use: {
        browserName: 'webkit',
        ...devices['Desktop Safari'],
      },
    },
    {
      name: 'Firefox',
      use: {
        browserName: 'firefox',
        ...devices['Desktop Firefox'],
      },
    },
  ],
});
