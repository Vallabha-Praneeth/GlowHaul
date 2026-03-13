import { test as setup } from '@playwright/test';
import { authFiles, type DemoRole } from './fixtures';

const AUTH_RETRY_LIMIT = 3;
const AUTH_SETUP_TIMEOUT_MS = 120_000;

function sleep(timeoutMs: number) {
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}

async function authenticateAsRole(
  request: import('@playwright/test').APIRequestContext,
  role: DemoRole
) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= AUTH_RETRY_LIMIT; attempt += 1) {
    try {
      const response = await request.post('/auth/test-login', {
        form: {
          role,
        },
        timeout: 60_000,
      });

      if (response.ok()) {
        await request.storageState({ path: authFiles[role] });
        return;
      }

      lastError = new Error(`Playwright auth bootstrap failed for ${role}: ${response.status()} ${await response.text()}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt < AUTH_RETRY_LIMIT) {
      await sleep(attempt * 1_500);
    }
  }

  throw lastError ?? new Error(`Playwright auth bootstrap failed for ${role}.`);
}

setup.setTimeout(AUTH_SETUP_TIMEOUT_MS);

setup('authenticate operator demo', async ({ request }) => {
  await authenticateAsRole(request, 'operator');
});

setup('authenticate planner demo', async ({ request }) => {
  await authenticateAsRole(request, 'planner');
});

setup('authenticate driver demo', async ({ request }) => {
  await authenticateAsRole(request, 'driver');
});
