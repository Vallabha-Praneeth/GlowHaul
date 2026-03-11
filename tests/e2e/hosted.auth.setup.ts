import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { hostedAuthFiles, hostedDemoEmails, roleHomePaths, type DemoRole } from './fixtures';

function getRequiredEnv(name: 'HOSTED_SUPABASE_SERVICE_ROLE_KEY' | 'HOSTED_SUPABASE_URL' | 'PLAYWRIGHT_BASE_URL') {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for hosted Playwright smoke tests.`);
  }

  return value;
}

function createHostedSupabaseAdminClient() {
  return createClient(
    getRequiredEnv('HOSTED_SUPABASE_URL'),
    getRequiredEnv('HOSTED_SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function authenticateHostedRole(
  request: import('@playwright/test').APIRequestContext,
  role: DemoRole
) {
  const supabase = createHostedSupabaseAdminClient();
  const nextPath = roleHomePaths[role];
  const baseURL = getRequiredEnv('PLAYWRIGHT_BASE_URL');
  const redirectTo = `${baseURL}/auth/confirm?next=${encodeURIComponent(nextPath)}`;
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: hostedDemoEmails[role],
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw new Error(`Hosted auth bootstrap failed for ${role}: ${error.message}`);
  }

  const confirmUrl =
    `${baseURL}/auth/confirm?token_hash=${data.properties.hashed_token}` +
    `&type=${data.properties.verification_type}` +
    `&next=${encodeURIComponent(nextPath)}`;

  const response = await request.get(confirmUrl);

  if (!response.ok()) {
    throw new Error(`Hosted auth confirm failed for ${role}: ${response.status()} ${await response.text()}`);
  }

  await request.storageState({ path: hostedAuthFiles[role] });
}

setup('authenticate hosted operator demo', async ({ request }) => {
  await authenticateHostedRole(request, 'operator');
});

setup('authenticate hosted planner demo', async ({ request }) => {
  await authenticateHostedRole(request, 'planner');
});

setup('authenticate hosted driver demo', async ({ request }) => {
  await authenticateHostedRole(request, 'driver');
});
