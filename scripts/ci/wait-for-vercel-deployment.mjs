const requiredEnv = ['VERCEL_TOKEN', 'VERCEL_PROJECT_ID', 'VERCEL_TEAM_ID', 'TARGET_SHA'];

for (const name of requiredEnv) {
  if (!process.env[name]) {
    console.error(`${name} is required.`);
    process.exit(1);
  }
}

const apiBase = 'https://api.vercel.com/v6/deployments';

function parsePositiveInt(envName, defaultValue) {
  const rawValue = process.env[envName];

  if (rawValue === undefined) {
    return defaultValue;
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed < 1) {
    console.error(`${envName} must be a positive integer. Received: ${rawValue}`);
    process.exit(1);
  }

  return Math.floor(parsed);
}

const maxAttempts = parsePositiveInt('VERCEL_DEPLOYMENT_POLL_ATTEMPTS', 40);
const sleepMs = parsePositiveInt('VERCEL_DEPLOYMENT_POLL_INTERVAL_MS', 15000);
const fetchRetryAttempts = parsePositiveInt('VERCEL_DEPLOYMENT_FETCH_RETRY_ATTEMPTS', 5);
const fetchRetryBaseSleepMs = parsePositiveInt('VERCEL_DEPLOYMENT_FETCH_RETRY_BASE_MS', 1000);
const fetchTimeoutMs = parsePositiveInt('VERCEL_DEPLOYMENT_FETCH_TIMEOUT_MS', 10000);

function sleep(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

async function fetchDeployments() {
  for (let attempt = 1; attempt <= fetchRetryAttempts; attempt += 1) {
    const url = new URL(apiBase);
    url.searchParams.set('projectId', process.env.VERCEL_PROJECT_ID);
    url.searchParams.set('teamId', process.env.VERCEL_TEAM_ID);
    url.searchParams.set('target', 'production');
    url.searchParams.set('limit', '20');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        },
      }).finally(() => clearTimeout(timeout));

      if (response.ok) {
        return await response.json();
      }

      if (response.status !== 429 && response.status < 500) {
        throw new Error(`Vercel deployment lookup failed: ${response.status} ${await response.text()}`);
      }
    } catch (error) {
      if (attempt === fetchRetryAttempts) {
        throw error;
      }
    }

    if (attempt < fetchRetryAttempts) {
      await sleep(fetchRetryBaseSleepMs * 2 ** (attempt - 1));
    }
  }

  throw new Error(`Vercel deployment lookup failed after ${fetchRetryAttempts} retry attempts.`);
}

function selectDeployment(payload) {
  return (payload.deployments ?? []).find(
    (deployment) => deployment.target === 'production' && deployment.meta?.githubCommitSha === process.env.TARGET_SHA
  );
}

let lastLookupError;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  let payload;

  try {
    payload = await fetchDeployments();
    lastLookupError = undefined;
  } catch (error) {
    lastLookupError = error;
    await sleep(sleepMs);
    continue;
  }

  const deployment = selectDeployment(payload);

  if (deployment) {
    if (deployment.readyState === 'READY' || deployment.state === 'READY') {
      process.stdout.write(`https://${deployment.url}`);
      process.exit(0);
    }

    if (deployment.readyState === 'ERROR' || deployment.state === 'ERROR') {
      console.error(`Deployment ${deployment.uid} failed.`);
      process.exit(1);
    }
  }

  await sleep(sleepMs);
}

if (lastLookupError) {
  console.error(`Timed out waiting for production deployment for commit ${process.env.TARGET_SHA}: ${lastLookupError}`);
  process.exit(1);
}

console.error(`Timed out waiting for production deployment for commit ${process.env.TARGET_SHA}.`);
process.exit(1);
