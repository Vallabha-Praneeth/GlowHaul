# Smoke Routes

This file defines the canonical Chrome MCP acceptance routes and the minimum visible expectations for each path.

Playwright remains the authoritative CI coverage. These routes are for manual browser confirmation after Playwright passes.

## Auth

### `/login`

- Expect heading: `Run campaigns that move.`
- Expect demo role buttons for operator, planner, and driver
- Expect phone OTP placeholder copy

### `/verify`

- Expect OTP placeholder screen and explicit placeholder framing

## Operator

### `/operator`

- Expect heading: `Texas fleet, one control room.`
- Expect create-slot form
- Expect incoming offers section
- Expect inventory editor section

## Planner

### `/planner/search`

- Expect heading: `Search mobile inventory fast.`
- Expect map provider label: `Map provider: MapLibre-ready`
- Expect submitted offers section
- Expect available slots section

## Driver

### `/driver`

- Expect heading: `Execute runs without call-chain chaos.`
- Expect assigned runs section
- Expect proof ledger section
- Expect proof upload control

## Route Order For A Fast Smoke Pass

1. `/login`
2. `/operator`
3. `/planner/search`
4. `/driver`

## Evidence To Capture

- One snapshot or screenshot per role route when the UI matters
- Console message list
- Network request list with failures called out
- Any route-specific notes saved into a report under [reports/smoke](/Users/anitavallabha/led_truck_webstack/reports/smoke)
