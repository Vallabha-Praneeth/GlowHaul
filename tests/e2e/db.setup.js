const { spawnSync } = require('node:child_process');
const { existsSync, mkdirSync, readdirSync, rmSync } = require('node:fs');
const path = require('node:path');
const { test: setup } = require('@playwright/test');

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);
const RESET_RETRY_LIMIT = 3;
const SUPABASE_HEALTH_TIMEOUT_MS = 90_000;
const repoRoot = path.resolve(__dirname, '../..');
const authStateDir = path.join(repoRoot, 'tests/e2e/.auth');

function shouldResetLocalDatabase() {
  if (process.env.PLAYWRIGHT_RESET_DB === '0') {
    return false;
  }

  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100';
  const hostname = new URL(baseURL).hostname;
  return LOCAL_HOSTS.has(hostname);
}

function clearStoredAuthState() {
  mkdirSync(authStateDir, { recursive: true });

  for (const fileName of readdirSync(authStateDir)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }

    rmSync(path.join(authStateDir, fileName), { force: true });
  }
}

function getSupabaseHealthUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:55421';
  return new URL('/auth/v1/health', apiUrl).toString();
}

function getSupabaseStorageVersionUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:55421';
  return new URL('/storage/v1/version', apiUrl).toString();
}

async function waitForUrl(url, timeoutMs = SUPABASE_HEALTH_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { cache: 'no-store' });

      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the local stack is reachable again.
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(
    `Timed out waiting for ${url}. Start the local Supabase stack before running Playwright.`,
  );
}

async function waitForSupabaseServices(timeoutMs = SUPABASE_HEALTH_TIMEOUT_MS) {
  await waitForUrl(getSupabaseHealthUrl(), timeoutMs);
  await waitForUrl(getSupabaseStorageVersionUrl(), timeoutMs);
}

function isRetryableResetFailure(error) {
  const errorText = [error?.message, error?.stdout?.toString?.(), error?.stderr?.toString?.()]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();

  return errorText.includes('error status 502') || errorText.includes('invalid response was received from the upstream server');
}

function isPostResetRestartFalseNegative(error) {
  const errorText = [error?.message, error?.stdout?.toString?.(), error?.stderr?.toString?.()]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();

  return errorText.includes('seeding data from supabase/seed.sql')
    && errorText.includes('restarting containers')
    && errorText.includes('error status 502');
}

async function resetLocalDatabaseWithRetry() {
  let lastError;

  for (let attempt = 1; attempt <= RESET_RETRY_LIMIT; attempt += 1) {
    await waitForSupabaseServices();

    const result = spawnSync('supabase', ['db', 'reset'], {
      cwd: path.join(repoRoot, 'packages/supabase'),
      env: process.env,
      encoding: 'utf8',
    });

    if (result.stdout) {
      process.stdout.write(result.stdout);
    }

    if (result.stderr) {
      process.stderr.write(result.stderr);
    }

    if (result.status === 0) {
      await waitForSupabaseServices();
      return;
    }

    const error = new Error(
      result.error?.message ??
        result.stderr?.trim() ??
        result.stdout?.trim() ??
        `supabase db reset exited with status ${result.status ?? 'unknown'}.`,
    );
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    lastError = error;

    if (isPostResetRestartFalseNegative(error)) {
      await waitForSupabaseServices();
      return;
    }

    if (!isRetryableResetFailure(error) || attempt === RESET_RETRY_LIMIT) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 3_000));
  }

  throw lastError;
}

setup.setTimeout(300_000);

setup('reset local Supabase state for deterministic E2E runs', async () => {
  clearStoredAuthState();

  if (!shouldResetLocalDatabase()) {
    return;
  }

  const packageJsonPath = path.join(repoRoot, 'packages/supabase/package.json');

  if (!existsSync(packageJsonPath)) {
    throw new Error('Missing packages/supabase/package.json. Cannot prepare local E2E database state.');
  }

  await resetLocalDatabaseWithRetry();
});
