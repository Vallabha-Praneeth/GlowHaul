import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100';
const shouldSkipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? 'chromium';
const usePrebuiltServer = process.env.PLAYWRIGHT_USE_PREBUILT === '1';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  expect: {
    timeout: 15_000,
  },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: shouldSkipWebServer
    ? undefined
    : {
        command: usePrebuiltServer
          ? 'PLAYWRIGHT_TEST=1 pnpm --filter @glowhaul/web start'
          : 'PLAYWRIGHT_TEST=1 pnpm --filter @glowhaul/web build && PLAYWRIGHT_TEST=1 pnpm --filter @glowhaul/web start',
        url: baseURL,
        timeout: 240_000,
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    {
      name: 'setup-db',
      testMatch: /db\.setup\.(js|ts)/,
    },
    {
      name: 'setup-auth',
      dependencies: ['setup-db'],
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: browserChannel,
      },
    },
    {
      name: 'chromium',
      dependencies: ['setup-auth'],
      testIgnore: /(auth|db)\.setup\.(js|ts)/,
      use: {
        ...devices['Desktop Chrome'],
        channel: browserChannel,
      },
    },
  ],
});
