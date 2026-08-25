# AGENTS.md — Guide for AI Coding Agents (and Humans)

FinanceLens is a personal finance tracker for Turkey: stocks, ETFs, eurobonds, gold, silver, cash,
income and expenses in one dashboard, with all values FX-normalized to TRY. This is the canonical
repository guide. It is tracked in git; do not rely on any untracked CLAUDE.md.

## Monorepo Layout

Turborepo + pnpm workspaces. Node ≥ 20.19, pnpm 9.

```
apps/
  web/    Next.js 16 frontend (React 19, Tailwind v4, TanStack Query)  → port 3000
  api/    NestJS 11 backend (Prisma 7, PostgreSQL via Supabase)        → port 3001
  docs/   Small Next.js documentation site                             → port 3002
packages/
  eslint-config/      @repo/eslint-config — shared ESLint flat configs (base / next-js / react-internal)
  typescript-config/  @repo/typescript-config — shared tsconfig presets
  ui/                 @repo/ui — STUB: only boilerplate button/card/code components; the real UI
                      lives inside apps/web/components (ShadcnUI). Do not add shared components here
                      unless you intend to grow this package.
```

## Commands

Run from the repo root (turbo tasks):

```bash
pnpm install            # install
pnpm dev                # run all apps          (pnpm dev --filter=web|api|docs)
pnpm build              # build all apps
pnpm lint               # ESLint everywhere (--max-warnings 0)
pnpm check-types        # tsc --noEmit everywhere (Next apps also run next typegen first)
pnpm test               # api: Jest, web: Vitest (turbo task "test")
```

API-specific:

```bash
pnpm --filter api prisma:generate   # generate Prisma client (required after schema changes / fresh install)
pnpm --filter api prisma:migrate    # prisma migrate dev
pnpm --filter api prisma db push    # push schema without migrations (used for local dev)
pnpm --filter api test -- --watch   # Jest watch mode
```

## Web App Routes (`apps/web/app`)

Public:

| Route | Page |
|-------|------|
| `/` | Landing page (redirects to `/dashboard` when signed in) |
| `/login` | Sign in |
| `/register` | Sign up |

Protected (session checked via Supabase middleware):

| Route | Page |
|-------|------|
| `/dashboard` | Overview: net worth, allocation donut, charts |
| `/dashboard/cash` | Multi-currency cash accounts |
| `/dashboard/gold`, `/dashboard/silver` | Precious metals holdings |
| `/dashboard/stocks` | Stocks with live prices, price chart, dividends |
| `/dashboard/eurobonds` | Eurobonds with coupons |
| `/dashboard/etfs` | ETFs with distributions |
| `/dashboard/incomes` | Income tracking (recurring supported) |
| `/dashboard/expenses` | Categorized expenses with filters |
| `/status` | Financial status: runway, projections |

## API Routes (`apps/api/src`, global prefix `/api`)

Global `AuthGuard` via `APP_GUARD` — every route requires a Bearer JWT except `@Public()` routes.
The only public route is `GET /api` (health).

- CRUD resources (each with `POST ''`, `GET ''`, `GET 'summary'`, `GET/PATCH/DELETE ':id'`):
  `stocks`, `etfs`, `eurobonds`, `incomes`, `expenses`, `cash`, `gold`, `silver`
- `incomes` GET supports `type`/`startDate`/`endDate`; `expenses` GET supports `category`/`paymentMethod`/date range
- `dashboard`: `GET overview` (FX-normalized totals incl. `fxRates` + `warnings`), `GET transactions`
- `precious-metals`: `GET gold/price`, `GET silver/price`
- `yahoo-finance`: `GET search?q=`, `GET quote/:symbol`, `GET historical/:symbol`
- Swagger at `/api/docs` (non-production only)

## Environment Variables

### `apps/web/.env.local` (see `.env.example`)

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Defaults to `http://localhost:3001/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | Required for auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required for auth |
| `NEXT_PUBLIC_USE_MOCK_DATA` | Set to `"true"` to enable demo mode (default off) |

### `apps/api/.env` (see `.env.example`)

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Supabase PostgreSQL connection string (Prisma) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY` | Supabase Admin API + JWT verification |
| `FRONTEND_URL` | CORS origin allowed by the API (defaults to `http://localhost:3000`) |
| `PORT` | Defaults to `3001` |
| `NODE_ENV` | Swagger docs are served only when not `production` |

## Conventions

- **Formatting** — All user-facing currency/date/percent formatting goes through
  `apps/web/lib/format.ts` (tr-TR locale, ₺ default currency, DD.MM.YYYY dates). Never call
  `toLocaleString` inline or hardcode `$`.
- **Enums** — Use Prisma enum values verbatim (`USD`, `SALARY`, `MARKET`, …). The web mock layer,
  DTOs, and DB must stay consistent; do not invent new casing.
- **Ownership pattern (P1)** — Every write in an API service is scoped to the authenticated user:
  update/delete use Prisma `updateMany`/`deleteMany` with `{ id, userId }` so a foreign id cannot be
  mutated, then check affected count and throw 404. Follow this for new resources.
- **Demo mode** — `apps/web/lib/api.ts` delegates to `api-mock.ts` when
  `process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'`. Mock data lives in `mock-data.ts`. Any new API
  surface needs a matching mock function; keep enum values identical to Prisma's.
- **Auth on the API** — Routes are protected by default; opt out only for genuinely public endpoints
  with `@Public()` (from `apps/api/src/auth`). Get the user id via the `@User()` decorator.
- **UI** — ShadcnUI components in `apps/web/components/ui`, semantic color tokens (neon mint/gold/orange
  brand + status colors) defined in `globals.css`; use tokens, not raw hex. Lucide icons only.
- **Language** — The product UI is Turkish (tr-TR). Code identifiers, comments, and most docs are English.
- **AI assistant** — lives in `apps/web/lib/assistant/*` (engine, history datasets, intent router,
  providers) and `apps/web/components/assistant/*` (UI). All numbers come from the deterministic
  engine (`projectFire`); the LLM (`narrate`, BYO key via `x-assistant-key` header to
  `/api/assistant`) only rephrases engine output and never invents numbers. Keep that split intact.
- **Brand palette** — primary mint `#70FFD2`, accent orange `#FF9137`, warning gold `#FFCC4D`,
  highlight yellow `#FFFC8C`. In light mode use `primary-strong` for mint-colored text (contrast);
  mint fills always carry dark foreground.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs two jobs (api, web) on Node 22:
install → `prisma:generate` → lint → test → build. Keep it green before opening a PR.

## License

MIT — see [LICENSE](LICENSE).
