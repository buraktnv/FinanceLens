---
name: finance-lens
description: "Use when working in the FinanceLens repo — a pnpm/turbo monorepo with a NestJS API (apps/api), Next.js web app (apps/web) and docs site (apps/docs). Covers dev commands, backend ownership/fetch conventions, frontend formatting/demo-mode/query conventions, testing setup, and known gotchas (eurobond couponRate, precious-metal pricing, ports)."
---

# FinanceLens Agent Guide

Personal finance tracker for Turkey: stocks, ETFs, eurobonds, gold, silver, cash, income
and expenses — all values FX-normalized to TRY. Product UI is Turkish (tr-TR); code,
comments and docs are English.

## Repo Map

Turborepo + pnpm workspaces (Node ≥ 20.19, pnpm 9):

| App/Package | What | Port |
|---|---|---|
| `apps/web` | Next.js 16, React 19, Tailwind v4, TanStack Query | 3000 |
| `apps/api` | NestJS 11, Prisma 7, PostgreSQL (Supabase) | 3001 |
| `apps/docs` | Small Next.js docs site | **3002** |
| `packages/ui` | `@repo/ui` — STUB only (button/card/code). Real UI lives in `apps/web/components` (ShadcnUI); don't add shared components here unless growing the package | — |

## Commands

From repo root:

```bash
pnpm install            # install
pnpm dev                # all apps (pnpm dev --filter=web|api|docs)
pnpm build              # build all
pnpm lint               # ESLint everywhere, zero warnings tolerated (--max-warnings 0)
pnpm check-types        # tsc --noEmit everywhere
pnpm test               # api: Jest, web: Vitest
```

API specifics:

```bash
pnpm --filter api prisma:generate   # required after schema changes / fresh install;
                                    # needs apps/api/.env with DATABASE_URL first
pnpm --filter api test              # Jest unit tests
```

## Backend Conventions (`apps/api/src`)

- **Pattern P1 — atomic owned writes.** Every write is scoped to the authenticated user.
  Update/delete use Prisma `updateMany`/`deleteMany` with `{ id, userId }`, then check the
  affected count: `if (updated.count === 0) throw new NotFoundException(...)`. For updates,
  re-fetch with `findUnique` afterwards and null-guard it too (see `stocks.service.ts`).
  Copy this pattern for every new resource.
- **DTOs** validated with class-validator (`@IsNumber`, `@IsEnum(IncomeType)`, …).
- **Query params**: bounded ints via pre-built pipes from `common/pipes`
  (`LIMIT_PIPE`, `MONTH_PIPE`, `YEAR_PIPE` — instances of `BoundedIntPipe`) or Query DTOs
  whose enums import directly from `@prisma/client` (e.g. `find-incomes.query.dto.ts`).
  Never hand-roll unvalidated query parsing.
- **FX rates** come from `YahooFinanceService.getFxRate(pair)` — cached 15 minutes
  (`FX_CACHE_TTL = 15 * 60 * 1000`). Don't add ad-hoc rate fetching.
- **Outbound fetches** (Yahoo Finance, precious-metals quotes) always pass
  `signal: AbortSignal.timeout(10_000)` and translate upstream failures into sanitized
  HttpExceptions (`ServiceUnavailableException('FX rate service unavailable')`,
  `'Symbol not found'`) — never rethrow raw upstream errors/bodies. The global
  `AllExceptionsFilter` (registered via `useGlobalFilters` in `main.ts`) returns a uniform
  `{ statusCode, message }` JSON body for everything.
- **Dashboard aggregates are TRY-normalized** and return a `warnings: string[]` array for
  missing/incomplete data — surface warnings instead of silently dropping positions.
- **HTTP client errors** (`apps/web/lib/api.ts`): the shared `request<T>()` helper parses the
  JSON error body and throws `new Error(message)`; keep new endpoints on this helper.

## Frontend Conventions (`apps/web`)

- **Formatting**: currency/date/percent ONLY via `lib/format.ts`
  (`formatCurrency` / `formatDate` / `formatPercent`, tr-TR locale, ₺ default).
  Never call `toLocaleString` inline or hardcode `$`.
- **Enums**: SCREAMING_SNAKE values matching `apps/api/prisma/schema.prisma` exactly
  (`USD`, `SALARY`, `MARKET`, …) across mocks, types and pages. Don't invent casing.
- **Demo mode**: `lib/api-mock.ts` exports `USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'` (default false). When true,
  `lib/api.ts` delegates to mock functions backed by `mock-data.ts`. Mocks mutate the
  module-level arrays live (push/splice), so state persists between demo actions. Any new
  API surface needs a matching mock with identical enum values.
- **TanStack Query keys are namespaced hierarchically**: `["stocks"]`,
  `["stocks", "summary"]`, `["dashboard", "overview"]`. Invalidate the resource key AND any
  summary/dashboard keys after mutations.
- **Shared components** live in `components/shared` (`StatCard`, `PageHeader`,
  `EmptyState`, `ErrorState`, `TableSkeleton`) — reuse them instead of duplicating.
- **Colors**: status colors are Tailwind fill tokens derived from CSS variables
  (`bg-success/15 text-success`, `bg-warning/…`, `bg-danger/…`) defined in
  `app/globals.css` under `@theme inline`. Never bare text-color-on-nothing or raw hex;
  dark mode must keep working by using tokens, not raw palette classes.

## Testing

- **API**: Jest, config in `apps/api/package.json` — `rootDir: src`,
  `testRegex: .*\.spec\.ts$`, node env. Colocated specs next to sources.
- **Web**: Vitest, node environment, `lib/__tests__/**/*.test.ts` only.
- TDD expected: write/adjust tests alongside implementation; lint gates run with
  zero-warnings tolerance — fix warnings, don't suppress.

## Adding a New Asset Module (Recipe)

Backend (follow an existing module, e.g. `stocks`):
1. Add Prisma model (+ enum fields) → migrate → `prisma:generate`.
2. Module/controller/service; service writes follow Pattern P1 (`updateMany`/`deleteMany`
   with `{ id, userId }`, count 0 → `NotFoundException`, null-guarded post-update read).
3. DTOs with class-validator; list filters via pipes or Query DTOs with Prisma enums.
4. Register module; routes require auth by default (`APP_GUARD`) — opt out only with
   `@Public()` for genuinely public endpoints; get user id via `@User()`.
5. Unit spec colocated (`*.spec.ts`).

Frontend (follow e.g. `app/dashboard/stocks/page.tsx`):
1. Types/enums matching Prisma exactly.
2. Mock functions in `api-mock.ts` + data in `mock-data.ts` (same enum values), wired into
   `lib/api.ts` delegation.
3. Page using `components/shared` pieces; format everything through `lib/format.ts`.
4. Queries namespaced (`["<resource>"]`, `["<resource>", "summary"]`); after create/update/
   delete invalidate the resource, its summary, and `["dashboard", "overview"]`.

## Gotchas

- **Eurobond `couponRate` is a decimal fraction**, not percent: `0.0525` = 5.25% (DTO doc
  says so; API summary math multiplies face value × quantity × rate directly; UI displays
  `rate * 100`). Note some legacy mock rows store percent-style numbers (e.g. `5.75`) —
  treat fraction as the convention for anything new.
- **Gold/silver prices are TRY per gram**, converted from per-troy-ounce quotes via
  `GRAMS_PER_TROY_OUNCE = 31.1035` in `precious-metals.service.ts`.
- **Docs app runs on port 3002**, not 3001 (3001 is the API).
