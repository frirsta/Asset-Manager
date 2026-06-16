# DevDonna — Frirsta's Studio + Outreach Platform

Two parallel products in one pnpm monorepo:
1. **DevDonna** — premium one-page landing site for Frirsta's Swedish solo full-stack developer studio, live at `/`
2. **DevDonna Outreach** — full-stack B2B email outreach SaaS at `/outreach/`

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned by Replit)
- Optional env: `RESEND_API_KEY` — Resend API key for actual email sending
- Optional env: `RESEND_FROM_EMAIL` — from address (default: `outreach@devdonna.se`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 with Replit Auth (OIDC + PKCE)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite, Tailwind v4, shadcn/ui, TanStack Query, wouter

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/auth.ts` — Replit Auth tables (users, sessions)
- `lib/db/src/schema/outreach.ts` — app tables (categories, contacts, campaigns, emails)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas
- `lib/replit-auth-web/` — browser auth hook (`useAuth`)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/email.ts` — Resend email sending logic
- `artifacts/outreach/src/` — Outreach SaaS frontend
- `artifacts/devdonna/src/` — Landing page frontend

## Architecture decisions

- Contract-first: OpenAPI spec → Orval codegen → typed hooks + Zod schemas for both client and server
- Replit Auth (OIDC PKCE) handles auth; sessions stored in PostgreSQL; `useAuth()` from `@workspace/replit-auth-web` on the frontend
- File import (CSV/XLSX) is a raw multer route NOT in the OpenAPI spec (avoided `File`/`Blob` Node.js type issues)
- Each user owns their own contacts/categories/campaigns — all queries scoped by `userId`
- Email body supports `{{company}}`, `{{name}}`, `{{email}}`, `{{website}}` placeholders for personalization
- If `RESEND_API_KEY` is not set, email sending is gracefully disabled with a warning log

## Product

- **DevDonna Outreach** core features: contact management with CSV/XLSX bulk import, category-based organization, campaign composer with personalization, Resend-powered email sending, delivery tracking per contact and per campaign, dashboard with stats

## User preferences

_Populate as you build._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` before touching route files (need exact Zod schema names)
- Body schema component names in OpenAPI must NOT match `<OperationIdPascal>Body` — use entity-shaped names to avoid TS2308 collisions
- File upload endpoint (`/contacts/import`) is intentionally excluded from the OpenAPI spec; use raw multer route
- `lib/replit-auth-web` needs `vite` as a devDep for `import.meta.env` types
- Google Fonts `@import url(...)` must come BEFORE `@import "tailwindcss"` in index.css

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `.local/skills/replit-auth/SKILL.md` for auth architecture
