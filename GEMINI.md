# GEMINI.md - Project Context & Instructions

This document provides foundational context, architectural overview, and development mandates for the LED Billboard Marketplace project.

## 🎯 Project Overview

A production-ready B2B marketplace and operations platform for mobile LED billboard truck operators across Texas (DFW, Houston, Austin, San Antonio, El Paso, RGV). The platform replaces informal workflows with a professional marketplace for Operators, Brokers, Drivers, and Admins.

### Architecture

This is a **pnpm monorepo** with the following structure:

- **`apps/admin`**: Next.js 14 (App Router) admin web console.
- **`apps/mobile`**: Expo (React Native) mobile app for all roles.
- **`packages/api`**: NestJS backend REST API.
- **`packages/db`**: Database schema, migrations, and Drizzle ORM client (Neon Postgres).
- **`packages/shared`**: Shared TypeScript types and Zod validation schemas.
- **`packages/shared`**: Shared TypeScript types and Zod validation schemas.
- **`tests/e2e-web`**: Playwright E2E tests for the web stack.
- **`tests/e2e-mobile`**: WebdriverIO + Appium E2E tests for the mobile app.

### Tech Stack

- **Frontend**: Next.js 15, Expo (React Native), TypeScript, Tailwind CSS / NativeWind.
- **Backend**: NestJS, TypeScript, Zod.
- **Data**: Neon Postgres (PostGIS), Drizzle ORM, Upstash Redis.
- **Storage**: S3-compatible (R2/S3) for proof of service.
- **Realtime**: SSE / WebSockets + Redis pub/sub.

## 🛠️ Building and Running

### Core Commands (Root)

- **Install**: `pnpm install`
- **Dev (All)**: `pnpm dev` (Runs admin, mobile, and API in parallel)
- **Build (All)**: `pnpm build`
- **Test (Unit/Int)**: `pnpm test`
- **Test (All)**: `pnpm test:all` (Includes mobile E2E)
- **Lint**: `pnpm lint`
- **Type Check**: `pnpm typecheck`
- **Format**: `pnpm format`

### Infrastructure (Docker)

Used primarily for E2E testing and local stack stabilization:
- **Start Stack**: `docker compose up -d`
- **Run Web E2E**: `pnpm test:e2e:web:docker`
- **Stop Stack**: `docker compose down`

### Database (packages/db)

- **Generate Migration**: `pnpm db:generate`
- **Apply Migration**: `pnpm db:migrate`
- **Studio (GUI)**: `pnpm db:studio`

## 📏 Development Conventions

### Coding Style & Standards

- **TypeScript-First**: Strict typing is mandatory. Avoid `any`.
- **Naming**:
    - React Components: `PascalCase.tsx`
    - Hooks: `useX.ts`
    - Tests: `*.spec.ts`
- **Validation**: Always use shared Zod schemas from `@led-billboard/shared` for API requests and responses.
- **Formatting**: 2 spaces, single quotes, semicolons, trailing commas (`es5`), 80-char width.

### Testing Strategy

- **API**: Unit and integration tests in `packages/api` using Jest.
- **Web E2E**: Playwright tests in `tests/e2e-web`. Use `data-testid` for critical user actions.
- **Mobile E2E**: Appium/WebdriverIO in `tests/e2e-mobile`.
- **Validation**: Any behavioral change **must** include corresponding tests.

### Delivery & Reporting

The project follows a **Phase-based delivery plan** tracked in `remaining.md`.
- **Active Phase**: Phase 05 (Hardening & Release Readiness).
- **Mandatory Reports**: Each phase implementation requires:
    - `reports/phase-XX/implementation.md`
    - `reports/phase-XX/tests.md`
    - `reports/phase-XX/self-critic.md`

### Environment Variables

Each app/package requires a `.env` file based on its `.env.example`. Key variables include `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, and S3 credentials.

## 📂 Key Directories & Files

- `remaining.md`: The authoritative source for the current execution plan and quality gates.
- `docs/spec/`: Detailed API contract (`api_contract.md`), DB schema (`db_schema_v1.md`), and UI specs.
- `AGENTS.md`: High-level repository guidelines for AI and developers.
- `docs/process/`: Governance and strategy documents (Self-critic, Web-stack plans).
- `scripts/`: Utility scripts for CI, Docker, and environment wait logic.

---
*This file is managed by Gemini CLI. Update it when significant architectural or process changes occur.*
