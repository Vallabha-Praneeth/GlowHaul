# Chrome MCP Acceptance Checklists

Chrome MCP is GlowHaul's manual real-browser acceptance and debugging lane.
It is useful for validating the live rendered UI, console health, network behavior, and route transitions after automated coverage is already green.

Playwright remains the CI-grade source of truth.

## Non-Negotiable Rules

- Run Chrome MCP only after `pnpm test:e2e` passes.
- Never use Chrome MCP in place of Playwright for merge or release gates.
- Treat Chrome MCP as a human-reviewed acceptance layer and debugging tool.
- Record console errors and failed network requests as blockers unless they are explicitly understood and accepted.
- Save smoke evidence under [reports/smoke](/Users/anitavallabha/led_truck_webstack/reports/smoke).

## Preconditions

Before starting a Chrome MCP session:

1. Run `pnpm typecheck`.
2. Run `pnpm --filter @glowhaul/web build`.
3. Run `pnpm test:e2e`.
4. Start the local app with `pnpm dev:web` if you are not validating a deployed preview.
5. Confirm the target stack is reachable.

## Mandatory Checks

Record all of these for every smoke pass:

- Current date and environment
- Whether Playwright was green first
- Route visited
- Account/role used
- Console errors
- Failed network requests
- Result summary
- Follow-up bugs or residual risk

## Core Acceptance Paths

Use the route matrix in [smoke-routes.md](/Users/anitavallabha/led_truck_webstack/docs/testing/smoke-routes.md) as the canonical route list.

### Auth

- Open `/login`
- Confirm hero, brand, CTA, and demo access buttons render
- Confirm phone OTP remains placeholder-only

### Operator

- Sign in as operator demo
- Open `/operator`
- Confirm create-slot form renders
- Confirm incoming offers render with action affordance when pending
- Confirm inventory editor renders persisted slot data

### Planner

- Sign in as planner demo
- Open `/planner/search`
- Confirm map provider card renders
- Confirm submitted offers section reflects accepted and pending states
- Confirm available slot cards expose offer submission only when allowed

### Driver

- Sign in as driver demo
- Open `/driver`
- Confirm assigned runs render
- Confirm proof ledger renders uploaded assets
- Confirm proof upload control is present

## What Chrome MCP Should Catch

- Layout/render regressions that Playwright did not assert directly
- Hydration-visible issues
- Console errors and warnings tied to the current change
- Failed route transitions
- Missing icons, broken assets, and unexpected network failures
- Obvious interaction regressions in the real browser

## What Chrome MCP Must Not Own

- CI pass/fail authority
- Regression coverage breadth
- Deterministic mutation verification
- Authentication-state bootstrapping

Those remain Playwright responsibilities and are tracked in [playwright-strategy.md](/Users/anitavallabha/led_truck_webstack/docs/testing/playwright-strategy.md).

## Acceptance Output

Each Chrome MCP run should create a dated report from the template in:

- [reports/smoke/TEMPLATE.md](/Users/anitavallabha/led_truck_webstack/reports/smoke/TEMPLATE.md)

Recommended filename format:

- `reports/smoke/YYYY-MM-DD-local-phase5.md`
