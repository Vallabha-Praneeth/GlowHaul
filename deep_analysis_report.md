# Deep Analysis Report - LED Truck Webstack

Date: 2026-03-09

## Brainstorm Summary

- Goal: build a production-oriented full-stack web app for a Texas LED truck marketplace using the direction in `GEMINI.md` and the interaction patterns in `__ui_reference/`.
- Immediate need: convert a product idea plus a UI prototype into an executable repo plan, local development workflow, and testing strategy.
- Constraint: the actual repo is almost empty today; `GEMINI.md` describes a future-state monorepo that does not exist yet.
- Constraint: local ports `3000`, `30001`, `40001`, `8000`, and `80001` are already in use, so the new stack must avoid them.
- Constraint: available platform inputs are Supabase, Vercel, Docker, Playwright, Context7, and Chrome MCP.
- Success criteria: a repo structure that can ship a real web app, stable local bootstrapping, UI extracted from the reference app, deterministic automated tests, and agent-driven browser validation via Chrome MCP.
- Non-goal for phase 1: mobile app delivery. `GEMINI.md` mentions Expo, but the user requested a web app and the current UI reference is web-first.
- Recommendation baseline: use a pnpm monorepo, Next.js App Router for the main app, Supabase for auth/data/storage/realtime, and defer a standalone NestJS service unless domain complexity justifies it.
- Latest guidance pulled through Context7 on 2026-03-09:
  - Next.js: App Router, clear server/client boundaries, server actions for trusted mutations, monorepo-aware ESLint root configuration.
  - Playwright: multi-project config, dedicated auth setup project, `webServer` arrays for multi-process local orchestration, trace/video on failure.
  - Supabase: local CLI stack, `@supabase/ssr` server client patterns, keep RLS enabled from day one, generate DB types from local schema.

## ASCII Wireframe

```text
User Browser
    |
    v
+---------------------------+
| apps/web (Next.js)        |
| - marketing/auth          |
| - operator dashboard      |
| - planner marketplace     |
| - driver run views        |
+------------+--------------+
             |
             | typed domain calls
             v
+---------------------------+      +----------------------+
| packages/core             |      | packages/ui          |
| - business rules          |      | - extracted design   |
| - zod schemas             |      | - tokens/components  |
| - API contracts           |      | - layouts/patterns   |
+------------+--------------+      +----------------------+
             |
             v
+---------------------------+
| packages/supabase         |
| - SQL migrations          |
| - RLS policies            |
| - generated TS types      |
| - storage helpers         |
+------------+--------------+
             |
             v
+---------------------------+
| Supabase Cloud / Local    |
| Postgres | Auth | Storage |
+---------------------------+

Local QA lanes
-------------
1. pnpm dev:web      -> Next.js on :3100
2. supabase start    -> local backend services
3. pnpm test:e2e     -> Playwright against seeded local stack
4. Chrome MCP        -> agent-led smoke, console, network, UX checks

Parallel execution lanes
------------------------
A. Repo/platform lane
B. UI extraction lane
C. Data/auth lane
D. Test/QA lane
```

## Clarifying Questions

- Should phase 1 include all three operational roles from the reference app on day one, or only operator plus planner?
- Is Vercel intended only for the Next.js app, or do you also want a separately hosted backend service in the roadmap?
- Do you want the app to stay close to the current dark "QuantumOps" visual language, or should that reference be treated as layout/flow only?
- Is Mapbox acceptable for the marketplace map, or should the map be abstracted so the provider can be swapped later?

## Plan Options

### Plan A - Minimal Safe Implementation

- Monorepo with `apps/web`, `packages/ui`, `packages/core`, `packages/supabase`, `tests/e2e`.
- Use Next.js + Supabase only.
- Implement auth, dashboards, listings, offers, bookings, proof uploads.
- Use Next.js server actions and route handlers for mutations and secure server-side integration.
- Best when you want the fastest path to a deployable web product on Vercel with low operational overhead.

### Plan B - Robust Maintainable Implementation

- Same monorepo as Plan A, plus `packages/testing`, `packages/config`, and a thin `apps/docs`.
- Treat Supabase as system of record, but isolate all domain logic behind typed service modules in `packages/core`.
- Keep the repo ready for a later dedicated API service without paying the complexity cost now.
- Add seed data, preview environments, role-specific Playwright fixtures, and Chrome MCP acceptance scripts/checklists.
- Best when you want to move quickly now without locking the architecture into "frontend talks directly to DB forever".

### Plan C - Fastest Experimental Implementation

- Single Next.js app repository with colocated UI, Supabase helpers, and Playwright.
- Copy the UI prototype directly, skip package extraction initially, and postpone serious test organization.
- Best only for proving demand or demos; expensive to clean up later.

### Recommendation

Recommend Plan B.

It fits the actual repo state, works well with Supabase + Vercel, preserves room for a future API service, and gives you a credible testing and delivery framework without front-loading unnecessary microservice complexity.

## Executive Summary

- The current repository is a planning shell, not an app codebase; the first deliverable should be repo scaffolding, not feature coding.
- `GEMINI.md` is useful as a target architecture, but parts of it conflict with the current ask: it assumes mobile and NestJS, while the user asked for a web-first build.
- The `__ui_reference/texas-truck-ops` app is strong enough to define navigation, role flows, design tokens, and interaction patterns for phase 1.
- The reference UI is effectively mobile-web first; the main implementation should preserve those flows while adding responsive desktop shells.
- The best initial stack is `pnpm` monorepo + Next.js App Router + Supabase + Tailwind + shared domain packages.
- Vercel should host the Next.js app; a separate always-on NestJS API is not justified until realtime or orchestration needs exceed what Next.js server code plus Supabase can handle.
- Local development should avoid the already-occupied ports and standardize around `3100` for web and Supabase CLI defaults for backend services.
- Automated confidence should come from Playwright; Chrome MCP should be treated as an end-to-end acceptance and debugging lane, not the sole test framework.
- The repo should be designed for parallel execution across four lanes: platform, UI extraction, data/auth, and test/QA.
- The first 30 minutes should establish workspace scaffolding, env templates, and a runnable empty Next.js app. The next 1-2 days should land auth, role shells, local data, and first E2E coverage.

## Existing Plans Alignment

### What plan files exist

- Present:
  - `GEMINI.md`
- Absent but referenced by `GEMINI.md`:
  - `remaining.md`
  - `docs/spec/`
  - `docs/process/`
  - `scripts/`
  - `.env.example` files
  - any root `package.json` / `pnpm-workspace.yaml`

### What this report aligns with

- Aligns with `GEMINI.md` on:
  - pnpm monorepo
  - TypeScript-first development
  - shared schemas and testing discipline
  - Playwright for web E2E
  - Docker-backed local stabilization
- Aligns with `__ui_reference/` on:
  - multi-role UX
  - phone-based auth flow
  - operations-heavy dashboard language
  - Texas region and slot/offers marketplace model

### Conflicts / decisions needed

- `GEMINI.md` assumes `apps/admin` and `apps/mobile`; phase 1 should instead start with `apps/web`.
- `GEMINI.md` assumes `packages/api` with NestJS; current infra favors starting with Supabase + Next.js server-side logic.
- `GEMINI.md` calls the active phase "Phase 05", but phases 01-04 do not exist in the repo.
- The UI reference is a Vite SPA prototype, while the target app should be a Next.js App Router app.

## System Overview

```text
[Browser]
   |
   v
[apps/web - Next.js App Router on Vercel]
   |  \
   |   \-- server actions / route handlers for trusted mutations
   |
   +--> [packages/ui]
   +--> [packages/core]
   +--> [packages/config]
   |
   v
[packages/supabase]
   |
   +--> Postgres schema + migrations
   +--> RLS policies
   +--> generated TypeScript types
   +--> storage buckets
   +--> seed scripts
   |
   v
[Supabase]
   |- Postgres
   |- Auth
   |- Storage
   |- Realtime

[tests/e2e]
   |- Playwright automated suite
   |- local seed/bootstrap
   |- auth fixtures

[Chrome MCP]
   |- manual acceptance flows
   |- console/network inspection
   |- post-deploy smoke verification
```

### Key Components

- `apps/web`
  - marketing shell if needed
  - auth pages
  - operator, planner, driver route groups
  - role-aware layouts
- `packages/ui`
  - extracted reusable UI from `__ui_reference/`
  - design tokens, primitives, shells, cards, navs, charts
- `packages/core`
  - Zod schemas
  - role policies
  - booking/offer/slot domain services
  - DTOs shared between app and tests
- `packages/supabase`
  - migrations
  - RLS
  - seeds
  - generated DB types
- `packages/testing`
  - test ids
  - seed helpers
  - browser fixtures
- `infra/docker`
  - local helper containers only if Supabase CLI alone is insufficient

## Data Flow & Boundaries

### Primary flows

- Auth
  - User enters phone or email flow in `apps/web`.
  - Next.js server-side auth helpers create and refresh sessions using Supabase SSR patterns.
  - Browser receives only publishable configuration; service-role keys remain server-only.
- Operator flow
  - Operator creates trucks and availability slots.
  - Mutations go through trusted server code, then persist to Supabase tables with RLS enforcement.
- Planner flow
  - Planner searches slots by region/date/price.
  - Reads come from filtered queries or RPCs shaped by role-aware access policies.
  - Offer creation uses server-side mutation endpoints or actions.
- Driver flow
  - Driver sees assigned runs and uploads proof.
  - Media goes to Supabase Storage with signed upload policies.
- Notifications / realtime
  - Initial phase can use Supabase Realtime for offer status updates.
  - Escalate to Redis-backed workers only if throughput or workflow orchestration demands it.

### Boundary rules

- Browser components must never talk directly to admin credentials or bypass role rules.
- Domain rules belong in `packages/core`, not inline inside React pages.
- DB schema, policies, and seed state must be versioned in `packages/supabase`.
- Playwright setup should seed data through trusted scripts or local SQL, not fragile UI bootstrapping.
- Chrome MCP should validate end-user behavior and operational quality, not own business assertions that belong in automated tests.

### External services

- Supabase: auth, Postgres, storage, realtime.
- Vercel: deployment for `apps/web`, previews, env management.
- Map provider: likely Mapbox initially, abstracted behind a simple adapter.
- Optional later:
  - Redis / queueing
  - Sentry
  - analytics

## Risk Register

### High

- Repo-state mismatch: `GEMINI.md` describes a future architecture that does not exist, which can cause over-planning and under-delivery.
- Premature NestJS adoption: introducing a separate API service before the web app exists adds deployment, auth, and local orchestration complexity with low near-term payoff.
- Role explosion: implementing operator, planner, driver, and admin at once may slow feature closure and test coverage.
- Test fragility: treating Chrome MCP as the primary E2E solution would produce non-repeatable validation and weak CI enforcement.
- Security drift: if RLS, storage policies, and service-role boundaries are deferred, the first working build will likely ship with unsafe shortcuts.

### Medium

- UI extraction debt: copying the Vite prototype directly into Next.js without package boundaries will create rewrite pressure.
- Port conflicts: default app choices often assume `3000`; local scripts must be explicit to avoid collisions with existing services.
- Map dependency lock-in: if map behavior is spread across pages, provider replacement becomes expensive.
- Seed inconsistency: without canonical dev seed data, QA and Playwright flows will diverge.

### Low

- Styling divergence between mobile-first reference and desktop delivery.
- Overuse of client components in Next.js, reducing caching and server-rendering benefits.

## Maintainability & Architecture Issues

- The reference app is page-heavy and mock-data driven. That is fine for design input, but not as a code organization model.
- Shared UI primitives and role shells should be extracted before feature pages multiply.
- Route groups should separate concerns clearly:
  - `app/(marketing)`
  - `app/(auth)`
  - `app/(app)/operator`
  - `app/(app)/planner`
  - `app/(app)/driver`
- Prefer server components for read-heavy pages and client components only where interactivity is required.
- Avoid coupling database row shapes directly to component props; define view models in `packages/core`.
- Add a `data-testid` policy early for all critical controls so Playwright and Chrome MCP flows remain stable.
- Centralize environment parsing in a typed config package rather than reading raw `process.env` across the app.

## Performance & Scalability Notes

- Next.js App Router should handle dashboard reads mostly through server-rendered data fetching and selective client hydration.
- Use pagination and filtered queries for marketplace results; do not render large map/list datasets eagerly.
- Generate narrow queries or RPCs for dashboard KPIs instead of loading whole records and aggregating client-side.
- Storage uploads should use signed URLs or secure server-side mediation, never raw privileged credentials.
- Start with Supabase Realtime only for the highest-value events such as offer status changes; avoid broadcasting every state mutation.
- Keep map rendering behind lazy boundaries so non-map routes do not pay the provider bundle cost.

## Security & Privacy Notes

- Keep RLS enabled from the first migration onward.
- Use `@supabase/ssr`-style server and browser clients with cookie-backed sessions.
- Never expose service-role keys to browser code or public env vars.
- Restrict storage buckets by role and object path conventions.
- Use signed URLs for proof assets and set short expirations for sensitive media.
- Audit all mutations for role ownership checks in addition to RLS.
- Mask or minimize PII in logs, screenshots, and Playwright traces when running auth flows.

## Refactor Plan

### Phase 0 - Architecture Freeze and Repo Bootstrap

Targets:

- `/package.json`
- `/pnpm-workspace.yaml`
- `/turbo.json`
- `/.editorconfig`
- `/.gitignore`
- `/.nvmrc`
- `/.env.example`
- `/README.md`
- `/docs/architecture/overview.md`

Actions:

- Initialize the pnpm monorepo.
- Standardize Node and package manager versions.
- Document port assignments:
  - web: `3100`
  - optional future API: `4100`
  - Playwright base URL: `http://127.0.0.1:3100`
- Create top-level scripts for dev, lint, typecheck, test, and e2e.

Verification:

- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`

### Phase 1 - Web App Shell and UI Extraction

Targets:

- `/apps/web/package.json`
- `/apps/web/app/layout.tsx`
- `/apps/web/app/(auth)/login/page.tsx`
- `/apps/web/app/(app)/operator/page.tsx`
- `/apps/web/app/(app)/planner/search/page.tsx`
- `/apps/web/app/(app)/driver/page.tsx`
- `/packages/ui/src/*`
- `/packages/config/src/*`

Actions:

- Create a Next.js App Router app.
- Migrate the reference design system and key primitives from `__ui_reference/`.
- Preserve the reference visual language:
  - dark logistics-tech palette
  - glowing cyan accent
  - KPI cards
  - bottom/tab navigation semantics
  - Texas-region marketplace patterns
- Add desktop-responsive shells while keeping mobile-first flows intact.

Verification:

- `pnpm --filter web dev`
- confirm operator, planner, driver shell routes render locally
- visual pass with Chrome MCP on login, dashboard, and marketplace routes

### Phase 2 - Supabase Foundation

Targets:

- `/packages/supabase/supabase/config.toml`
- `/packages/supabase/migrations/*`
- `/packages/supabase/seed.sql`
- `/packages/supabase/types/database.ts`
- `/packages/core/src/schema/*`
- `/apps/web/lib/supabase/server.ts`
- `/apps/web/lib/supabase/client.ts`

Actions:

- Initialize Supabase locally.
- Create schema for users, organizations, trucks, slots, offers, bookings, runs, and proof assets.
- Add RLS policies by role.
- Generate TS types from local schema.
- Implement auth/session plumbing in Next.js.

Verification:

- `supabase start`
- `supabase db reset`
- `supabase gen types --lang=typescript --local > packages/supabase/types/database.ts`
- login and protected route checks via Playwright setup project

### Phase 3 - Core Marketplace Features

Targets:

- `/apps/web/app/(app)/operator/**`
- `/apps/web/app/(app)/planner/**`
- `/apps/web/app/(app)/driver/**`
- `/packages/core/src/services/*`
- `/packages/core/src/view-models/*`

Actions:

- Replace mock data with real queries and mutations.
- Implement slot management, offer creation, booking status, and proof upload.
- Add role-based layouts and optimistic UX only where justified.

Verification:

- unit tests for domain logic
- seeded local walkthroughs via Playwright
- Chrome MCP network/console inspection on critical flows

### Phase 4 - Test Platform and Local Stability

Targets:

- `/playwright.config.ts`
- `/tests/e2e/auth.setup.ts`
- `/tests/e2e/operator/*.spec.ts`
- `/tests/e2e/planner/*.spec.ts`
- `/tests/e2e/driver/*.spec.ts`
- `/packages/testing/src/*`
- `/docker-compose.yml`
- `/scripts/wait-for-stack.sh`

Actions:

- Configure Playwright with:
  - setup project for auth state
  - role-specific projects or fixtures
  - `webServer` orchestration for local app startup
  - trace on first retry
  - video/screenshot on failure
- Keep Docker usage focused on stabilizing local test dependencies, not replacing standard app dev.
- Add seed/bootstrap commands for deterministic E2E.

Verification:

- `pnpm test:e2e`
- `pnpm test:e2e --project=chromium`
- local run in clean environment after `supabase stop && supabase start`

### Phase 5 - Chrome MCP Acceptance Lane

Targets:

- `/docs/testing/chrome-mcp-checklists.md`
- `/docs/testing/smoke-routes.md`
- `/reports/smoke/*`

Actions:

- Define agent-executable smoke checklists for:
  - login
  - operator slot creation
  - planner search and offer flow
  - driver proof upload
- Use Chrome MCP for:
  - visual verification
  - console error checks
  - network request inspection
  - accessibility snapshots on key pages
- Treat failures here as release blockers for previews, but not as a substitute for CI tests.

Verification:

- local preview walkthrough using Chrome MCP
- Vercel preview smoke on every milestone branch

### Phase 6 - Hardening and Deployment

Targets:

- `/.github/workflows/ci.yml`
- `/.github/workflows/preview-smoke.yml`
- `/vercel.json` if needed
- `/docs/runbooks/release.md`

Actions:

- Add CI for lint, typecheck, unit tests, Playwright.
- Wire Vercel preview URLs into acceptance workflow.
- Add error monitoring and deployment runbooks.

Verification:

- green CI on a clean clone
- successful Vercel preview deploy
- Playwright + Chrome MCP smoke pass

### First 30 Minutes

- Scaffold the pnpm root and `apps/web`.
- Reserve non-conflicting local ports.
- Add root env templates and package scripts.
- Create architecture and UI extraction docs.

### Next 1-2 Days

- Finish Next.js shell and shared UI package.
- Stand up Supabase local schema, RLS, and auth plumbing.
- Land seeded Playwright auth and one operator plus one planner happy-path test.
- Add Chrome MCP smoke checklist and first preview validation path.

### Multi-Agent Execution Plan

- Agent 1: platform and monorepo bootstrap.
- Agent 2: UI extraction from `__ui_reference/` into `packages/ui`.
- Agent 3: Supabase schema, auth, policies, seeds.
- Agent 4: Playwright, Docker helpers, Chrome MCP smoke documentation.

Dependencies:

- Agent 2 can begin after route map and token strategy are agreed.
- Agent 3 can begin once the domain entity list is frozen.
- Agent 4 can begin once auth selectors and `data-testid` conventions are defined.

## Test / Verification Plan

### Automated

- Lint: ESLint across root, app, and packages.
- Types: TypeScript project references or workspace typecheck.
- Unit:
  - schema validation
  - domain services
  - auth guards
- Integration:
  - server-side data access wrappers
  - storage upload signing
- E2E via Playwright:
  - auth bootstrap
  - operator creates slot
  - planner filters marketplace and sends offer
  - operator accepts/rejects offer
  - driver uploads proof

### Chrome MCP

- Run after automated E2E passes.
- Validate:
  - no blocking console errors
  - route transitions and form states
  - responsive rendering on key breakpoints
  - basic accessibility tree sanity
  - network request success for auth and mutations

### Suggested commands

- `pnpm dev:web`
- `supabase start`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:e2e --ui`

### Acceptance criteria

- Fresh clone boots locally with documented steps only.
- Seed data produces predictable role accounts and visible workflows.
- Playwright passes on local seeded stack.
- Chrome MCP smoke passes on local and preview deployment.
- No critical route depends on mock data.

## Appendix: Important Files + Quick Commands

### Current important files

- `GEMINI.md`
- `__ui_reference/texas-truck-ops/src/App.tsx`
- `__ui_reference/texas-truck-ops/src/index.css`
- `__ui_reference/texas-truck-ops/src/pages/auth/Login.tsx`
- `__ui_reference/texas-truck-ops/src/pages/operator/OperatorDashboard.tsx`
- `__ui_reference/texas-truck-ops/src/pages/broker/MarketplaceSearch.tsx`
- `__ui_reference/texas-truck-ops/src/components/BottomNav.tsx`
- `__ui_reference/texas-truck-ops/src/components/TexasMap.tsx`

### Proposed future files

- `/package.json`
- `/pnpm-workspace.yaml`
- `/turbo.json`
- `/apps/web/app/(auth)/login/page.tsx`
- `/apps/web/app/(app)/operator/page.tsx`
- `/packages/ui/src/components/*`
- `/packages/core/src/services/*`
- `/packages/supabase/migrations/*`
- `/playwright.config.ts`
- `/tests/e2e/**/*.spec.ts`

### Quick commands

- `codex mcp list`
- `pnpm create next-app@latest apps/web`
- `supabase start`
- `supabase db reset`
- `pnpm exec playwright test`

### Research inputs

- Context7: `/vercel/next.js`
- Context7: `/microsoft/playwright`
- Context7: `/supabase/supabase`
