# 2026-03-09 Phase 6 Workflow Smoke

## Scope

- operator dashboard triage and campaign progression
- planner marketplace filters and status visibility
- live-sync badge visibility

## Environment

- local Next.js dev server on `http://127.0.0.1:3100`
- local Supabase stack from `packages/supabase/supabase`
- Chrome MCP manual smoke

## Result

- pass

## Notes

- operator demo login reached `/operator`
- operator dashboard showed `Live updates on`, active campaigns, and proof review queue
- planner demo login reached `/planner/search`
- planner marketplace showed `Live updates on`, filter controls, confirmed/rejected offer states, and marketplace inventory

## Browser Health

- console errors: none
- console warnings: none
- failed network requests: none
