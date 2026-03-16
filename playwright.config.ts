import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100';
const shouldSkipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? 'chromium';
const usePrebuiltServer = process.env.PLAYWRIGHT_USE_PREBUILT === '1';
const hostedSmoke = process.env.PLAYWRIGHT_HOSTED_SMOKE === '1';

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
  webServer: shouldSkipWebServer || hostedSmoke
    ? undefined
    : {
        command: usePrebuiltServer
          ? 'PLAYWRIGHT_TEST=1 pnpm --filter @glowhaul/web start'
          : 'PLAYWRIGHT_TEST=1 pnpm --filter @glowhaul/web build && PLAYWRIGHT_TEST=1 pnpm --filter @glowhaul/web start',
        url: baseURL,
        timeout: 240_000,
        // Default runs should always start against the current build. Reuse is opt-in
        // through the explicit PLAYWRIGHT_SKIP_WEBSERVER reuse scripts.
        reuseExistingServer: false,
      },
  projects: hostedSmoke
    ? [
        {
          name: 'setup-hosted-auth',
          testMatch: /hosted\.auth\.setup\.ts/,
        },
        {
          name: 'hosted-chromium',
          dependencies: ['setup-hosted-auth'],
          testMatch: /hosted\/.*\.spec\.ts/,
          use: {
            ...devices['Desktop Chrome'],
            channel: browserChannel,
          },
        },
      ]
    : [
        {
          name: 'setup-db',
          testMatch: /db\.setup\.(js|ts)/,
        },
        {
          name: 'setup-auth',
          dependencies: ['setup-db'],
          testMatch: /auth\.setup\.ts/,
          testIgnore: /hosted\.auth\.setup\.ts/,
          use: {
            ...devices['Desktop Chrome'],
            channel: browserChannel,
          },
        },
        {
          name: 'chromium',
          dependencies: ['setup-auth'],
          testIgnore: [/(auth|db|hosted\.auth)\.setup\.(js|ts)/, /hosted\/.*\.spec\.ts/],
          use: {
            ...devices['Desktop Chrome'],
            channel: browserChannel,
          },
        },
      ],
});
