import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrlCandidate, resolveAppUrl, trimTrailingSlash } from './index';

test('trimTrailingSlash removes only a terminal slash', () => {
  assert.equal(trimTrailingSlash('https://glow-haul.vercel.app/'), 'https://glow-haul.vercel.app');
  assert.equal(trimTrailingSlash('https://glow-haul.vercel.app/auth/confirm'), 'https://glow-haul.vercel.app/auth/confirm');
});

test('normalizeUrlCandidate rejects blank sentinel and malformed values', () => {
  assert.equal(normalizeUrlCandidate(''), null);
  assert.equal(normalizeUrlCandidate('   '), null);
  assert.equal(normalizeUrlCandidate('null'), null);
  assert.equal(normalizeUrlCandidate('undefined'), null);
  assert.equal(normalizeUrlCandidate('foo bar'), null);
  assert.equal(normalizeUrlCandidate('a.example.com,b.example.com'), null);
  assert.equal(normalizeUrlCandidate('https://null'), null);
});

test('normalizeUrlCandidate accepts absolute and host-only values', () => {
  assert.equal(normalizeUrlCandidate('https://glow-haul.vercel.app/'), 'https://glow-haul.vercel.app');
  assert.equal(normalizeUrlCandidate('http://127.0.0.1:3100/'), 'http://127.0.0.1:3100');
  assert.equal(normalizeUrlCandidate('glow-haul.vercel.app'), 'https://glow-haul.vercel.app');
  assert.equal(normalizeUrlCandidate('127.0.0.1:3100'), 'http://127.0.0.1:3100');
});

test('resolveAppUrl uses origin when valid and ignores Origin: null', () => {
  assert.equal(
    resolveAppUrl({
      origin: 'https://glow-haul.vercel.app/',
      NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100',
    }),
    'https://glow-haul.vercel.app'
  );

  assert.equal(
    resolveAppUrl({
      origin: 'null',
      NEXT_PUBLIC_SITE_URL: 'https://glow-haul.vercel.app',
      NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100',
    }),
    'https://glow-haul.vercel.app'
  );
});

test('resolveAppUrl validates forwarded host and proto before using them', () => {
  assert.equal(
    resolveAppUrl({
      forwardedHost: 'preview-123.vercel.app',
      forwardedProto: 'https',
      NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100',
    }),
    'https://preview-123.vercel.app'
  );

  assert.equal(
    resolveAppUrl({
      forwardedHost: '127.0.0.1:3100',
      forwardedProto: 'http',
      NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100',
    }),
    'http://127.0.0.1:3100'
  );

  assert.equal(
    resolveAppUrl({
      forwardedHost: '127.0.0.1:3100',
      NEXT_PUBLIC_SITE_URL: 'https://glow-haul.vercel.app',
      NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100',
    }),
    'http://127.0.0.1:3100'
  );

  assert.equal(
    resolveAppUrl({
      forwardedHost: 'preview-123.vercel.app,proxy.local',
      forwardedProto: 'https',
      NEXT_PUBLIC_SITE_URL: 'https://glow-haul.vercel.app',
      NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100',
    }),
    'https://glow-haul.vercel.app'
  );

  assert.equal(
    resolveAppUrl({
      forwardedHost: 'preview-123.vercel.app',
      forwardedProto: 'https, http',
      NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100',
    }),
    'https://preview-123.vercel.app'
  );
});

test('resolveAppUrl honors production preview and fallback precedence', () => {
  assert.equal(
    resolveAppUrl({
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'glow-haul.vercel.app',
      NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100',
    }),
    'https://glow-haul.vercel.app'
  );

  assert.equal(
    resolveAppUrl({
      VERCEL_ENV: 'preview',
      VERCEL_BRANCH_URL: 'glow-haul-git-feature.vercel.app',
      VERCEL_URL: 'glow-haul-random.vercel.app',
      NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100',
    }),
    'https://glow-haul-git-feature.vercel.app'
  );

  assert.equal(
    resolveAppUrl({
      VERCEL_ENV: 'preview',
      VERCEL_URL: 'glow-haul-random.vercel.app',
      NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100',
    }),
    'https://glow-haul-random.vercel.app'
  );

  assert.equal(
    resolveAppUrl({
      NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100/',
    }),
    'http://127.0.0.1:3100'
  );

  assert.equal(resolveAppUrl({}), 'http://127.0.0.1:3100');
});
