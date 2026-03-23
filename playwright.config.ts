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
    ['html', { outputFolder: 'reports/playwright-report', open: 'on-failure' }],
    ['playwright-smart-reporter'],
    ['./reports/slack-report/slack-reporter.ts'],
    ['playwright-smart-reporter'],
  ],

  /* Shared settings */
  use: {
    trace: 'on-first-retry',
    acceptDownloads: true,

    launchOptions: {
      args: ['--disable-blink-features=AutomationControlled'],
    },

    viewport: { width: 1400, height: 1000 },
  },

  /* Projects */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      testDir: './src/setup',
    },
    {
      name: 'Google Chrome',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1400, height: 1000 },
        storageState: './auth.json',
      },
    },
    {
      name: 'Safari',
      dependencies: ['setup'],
      use: {
        browserName: 'webkit',
        ...devices['Desktop Safari'],
        storageState: './auth.json',
      },
    },
    {
      name: 'Firefox',
      dependencies: ['setup'],
      use: {
        browserName: 'firefox',
        ...devices['Desktop Firefox'],
        storageState: './auth.json',
      },
    },
  ],
});
