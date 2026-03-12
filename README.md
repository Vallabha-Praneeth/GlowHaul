# GlowHaul

GlowHaul is the web operations and marketplace platform for Out-of-the-Box Advertising. This repository is intentionally web-first: operator, planner, and driver workflows share a single Next.js application backed by Supabase and tested with Playwright plus Chrome MCP acceptance checks.

## Current Direction

- App name: `GlowHaul`
- Brand direction: dark logistics-tech UI based on the `__ui_reference/texas-truck-ops` prototype
- Architecture: `pnpm` monorepo, Next.js App Router, Supabase, Playwright
- Maps: free-first abstraction using MapLibre-compatible styles before any paid provider commitment
- Auth: email + magic link first, phone OTP kept as a product-aligned placeholder flow, plus local-only demo password access for seeded test users

## Planned Workspace

```text
apps/web              Next.js App Router app
packages/config       Typed env and app configuration
packages/core         Domain types, schemas, service boundaries
packages/supabase     Local stack config, migrations, seeds, generated types
packages/testing      Shared test ids, fixtures, test helpers
packages/ui           Shared design tokens and UI building blocks
tests/e2e             Playwright end-to-end coverage
docs/testing          Chrome MCP smoke and acceptance checklists
```

## Local Ports

- Web app: `3100`
- Playwright base URL: `http://127.0.0.1:3100`
- Supabase local API: `http://127.0.0.1:55421`
- Supabase local DB: `127.0.0.1:55422`

## Commands

These commands are scaffolded now and become runnable after dependency installation:

```bash
pnpm install
pnpm dev:web
pnpm dev:web:e2e
pnpm test:e2e
pnpm test:e2e:setup-db
pnpm test:e2e:chromium
```

For standalone Playwright project runs against an already-running local app server, start `pnpm dev:web:e2e` and then use:

```bash
pnpm test:e2e:setup-db:reuse
pnpm test:e2e:setup-auth:reuse
pnpm test:e2e:chromium:reuse
```

`pnpm test:e2e` now resets the local Supabase database and clears stored Playwright auth state before the role bootstrap runs. This keeps E2E deterministic against the seeded local stack. Set `PLAYWRIGHT_RESET_DB=0` only when you intentionally need to preserve existing local DB state.

The managed Playwright web server runs the built app with `next start`, not the Next.js dev server. Reuse-mode runs can still target a manually started local server when you need interactive debugging.

## CI

GitHub Actions now runs the same verification lane the repo uses locally:

```bash
pnpm typecheck
pnpm --filter @glowhaul/web build
pnpm test:e2e
```

The workflow boots a local Supabase stack on the runner, exports the local anon and service-role keys into the job environment, installs the Chromium Playwright browser, and uploads Playwright artifacts on every run.

A separate hosted smoke workflow now runs after `CI` succeeds on `main`. It waits for the matching Vercel production deployment, then runs a minimal authenticated Playwright pass against the deployed app. This lane is supplemental and does not replace the local CI-grade suite.

Reproduce the hosted lane locally with:

```bash
PLAYWRIGHT_BASE_URL=https://glow-haul.vercel.app \
HOSTED_SUPABASE_URL=https://your-project.supabase.co \
HOSTED_SUPABASE_SERVICE_ROLE_KEY=your_service_role_or_sb_secret_key \
pnpm test:e2e:hosted
```

## Deployment

Hosted deployment is structured around `Vercel` plus a hosted `Supabase` project:

- Vercel Preview and Production share the same app env contract.
- `NEXT_PUBLIC_SITE_URL` is reserved for the canonical production URL.
- Preview auth redirects resolve from the active Vercel deployment host.
- Supabase Auth should keep production `Site URL` exact and allow preview redirects with the Vercel wildcard pattern.

Use [docs/deployment/vercel-hosted-supabase.md](docs/deployment/vercel-hosted-supabase.md) as the deployment source of truth.

## Testing Model

- `Playwright` is the CI-grade E2E system.
- `Hosted Smoke` is a lightweight post-deploy Playwright acceptance lane against the real production deployment.
- `Chrome MCP` is the real-browser smoke, acceptance, and debugging lane.
- Chrome MCP never replaces automated E2E in CI.
- Chrome MCP reports belong under `reports/smoke/`.
- Reproduce the hosted Playwright lane locally with `PLAYWRIGHT_BASE_URL`, `HOSTED_SUPABASE_URL`, and `HOSTED_SUPABASE_SERVICE_ROLE_KEY`, then run `pnpm test:e2e:hosted`.

## Manual Acceptance

- Start with `pnpm test:e2e`.
- Then run the Chrome MCP smoke flow described in [docs/testing/chrome-mcp-checklists.md](/Users/anitavallabha/led_truck_webstack/docs/testing/chrome-mcp-checklists.md).
- Use [docs/testing/smoke-routes.md](/Users/anitavallabha/led_truck_webstack/docs/testing/smoke-routes.md) as the route matrix.

## Notes

- The repo intentionally does not include a mobile app or NestJS service.
- `deep_analysis_report.md` is the current architecture and delivery baseline.
