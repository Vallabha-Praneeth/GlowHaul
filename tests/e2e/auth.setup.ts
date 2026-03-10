import { test as setup } from '@playwright/test';
import { authFiles, type DemoRole } from './fixtures';

async function authenticateAsRole(
  request: import('@playwright/test').APIRequestContext,
  role: DemoRole
) {
  const response = await request.post('/auth/test-login', {
    form: {
      role,
    },
  });

  if (!response.ok()) {
    throw new Error(`Playwright auth bootstrap failed for ${role}: ${response.status()} ${await response.text()}`);
  }

  await request.storageState({ path: authFiles[role] });
}

setup('authenticate operator demo', async ({ request }) => {
  await authenticateAsRole(request, 'operator');
});

setup('authenticate planner demo', async ({ request }) => {
  await authenticateAsRole(request, 'planner');
});

setup('authenticate driver demo', async ({ request }) => {
  await authenticateAsRole(request, 'driver');
});
