# Playwright Strategy

## Purpose

Playwright is the deterministic end-to-end test system for GlowHaul. It is the CI-grade check for real user flows and must stay authoritative over any manual browser validation.

## Initial Shape

- One root `playwright.config.ts`
- One `setup` project for auth bootstrap
- Chromium as the first supported browser target
- Local base URL fixed to `http://127.0.0.1:3100`

## Phase 1 Targets

- Login shell renders
- Operator dashboard shell renders
- Planner marketplace shell renders
- Driver shell renders

## Expansion Path

- Add seeded auth state per role
- Add mutation coverage for slots, offers, bookings, and proof uploads
- Add preview-environment smoke execution in CI

## Current Phase 4 State

- `setup-db` resets the local Supabase database and clears saved auth state before any role bootstrap runs
- `setup-auth` project generates auth state for operator, planner, and driver through a dev-only HTTP bootstrap route
- the managed Playwright web server runs the built Next app, keeping the CI-grade path closer to production and avoiding dev-server-only latency spikes
- CI sets `PLAYWRIGHT_USE_PREBUILT=1`, so the workflow builds the app once and then runs Playwright against `next start`
- role-specific specs live under `tests/e2e/auth`, `tests/e2e/operator`, `tests/e2e/planner`, and `tests/e2e/driver`
- shared helpers live in [fixtures.ts](/Users/anitavallabha/led_truck_webstack/tests/e2e/fixtures.ts)
- `setup-auth` no longer depends on a browser launch, which keeps project-scoped runs stable in constrained local environments
- `PLAYWRIGHT_RESET_DB=0` is available as an explicit local override, but the default path is a seeded reset so the suite does not drift into polluted-state flake

## Relationship To Chrome MCP

- Playwright is still the merge and release gate
- Chrome MCP runs only after Playwright is green
- Chrome MCP findings complement Playwright but do not override it as the system of record
