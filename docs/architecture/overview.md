# GlowHaul Architecture Overview

## Scope

GlowHaul is a single web product for three roles:

- Operator
- Planner
- Driver

The repo is optimized for fast local iteration, clean deployment to Vercel, and stable testing against a local-first Supabase stack.

## System Shape

```text
Browser
  |
  v
apps/web (Next.js App Router)
  |
  +-- packages/ui
  +-- packages/core
  +-- packages/config
  |
  v
packages/supabase
  |
  v
Supabase (Auth, Postgres, Storage, Realtime)

tests/e2e (Playwright)
docs/testing (Chrome MCP smoke playbooks)
```

## Principles

- Keep the first shipping architecture small and reversible.
- Put business rules in `packages/core`, not inside route files.
- Keep React server/client boundaries explicit.
- Preserve the reference app's brand direction while improving desktop behavior and testability.
- Use free-first infrastructure where provider lock-in would be premature.
- Keep planner-facing marketplace logic separate from operator supply management and driver execution flows.
