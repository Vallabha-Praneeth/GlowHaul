# Vercel + Hosted Supabase

GlowHaul stays local-first for development, but hosted deployments should use Vercel project environments plus a hosted Supabase project.

## Vercel project shape

- Framework: `Next.js`
- Root Directory: `apps/web`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm --filter @glowhaul/web build`

## Vercel environment variables

Set these in Vercel for both `Preview` and `Production` unless noted otherwise:

```bash
NEXT_PUBLIC_APP_NAME=GlowHaul
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace_me
SUPABASE_SERVICE_ROLE_KEY=replace_me
AUTH_ENFORCE_ROUTE_GUARDS=true
AUTH_PRIMARY_METHOD=magic-link
AUTH_PHONE_OTP_ENABLED=false
AUTH_PHONE_OTP_PLACEHOLDER=+15555550123
AUTH_PHONE_OTP_LENGTH=6
AUTH_PHONE_OTP_EXPIRES_IN_SECONDS=60
NEXT_PUBLIC_MAP_PROVIDER=maplibre
NEXT_PUBLIC_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json
```

Set this in `Production` only:

```bash
NEXT_PUBLIC_SITE_URL=https://glowhaul.example.com
```

Notes:

- `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_BRANCH_URL`, and `VERCEL_PROJECT_PRODUCTION_URL` are system environment variables injected automatically by Vercel. Do not define them manually.
- GlowHaul now resolves auth redirect origins in this order: request origin and forwarded host, then `NEXT_PUBLIC_SITE_URL`, then Vercel system envs, then the local fallback URL.
- Preview deployments should not hardcode `NEXT_PUBLIC_SITE_URL` unless they use a dedicated preview domain. The app will use the active Vercel preview host automatically.

## Supabase Auth settings

In the hosted Supabase project:

- `Site URL`: set to your production app URL, for example `https://glowhaul.example.com`
- `Additional Redirect URLs`: add the local and preview patterns below

Recommended redirect allow-list:

```text
http://127.0.0.1:3100/**
http://localhost:3100/**
https://*-<team-or-account-slug>.vercel.app/**
https://glowhaul.example.com/auth/confirm
```

Notes:

- Keep the production callback exact.
- Use the Vercel wildcard only for previews.
- GlowHaul magic-link requests target `/auth/confirm?next=...`, so the preview wildcard is the practical allow-list entry for previews.

## Local and hosted split

- Local development: use `.env.local` or `.env.example` with the local Supabase stack.
- Vercel preview: use `.env.preview.example` as the value template.
- Vercel production: use `.env.production.example` as the value template.

## Pulling envs locally

If you use the Vercel CLI, pull hosted envs into a local file instead of copying values by hand:

```bash
vercel env pull .env.vercel.local
```

Do not commit pulled environment files.
