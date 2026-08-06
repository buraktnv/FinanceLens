<div align="center">

# FinanceLens

### Personal Finance Tracker — Full-Stack Monorepo

[![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS_11-red?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?logo=react)](https://react.dev/)

Track investments, income, and expenses in one dashboard. Stocks, ETFs, eurobonds, gold, silver, and cash — with live price data, profit/loss tracking, and financial projections.

</div>

---

## Features

### Portfolio Management
- **Stocks** — Full CRUD with live price polling (Yahoo Finance), interactive price charts, dividend tracking
- **ETFs** — Holdings management with expense ratio and distribution tracking
- **Eurobonds** — Bond portfolio with coupon rate, maturity date, and payment tracking
- **Gold & Silver** — Precious metals with live price data and profit/loss calculation
- **Cash Accounts** — Multi-currency bank account tracking

### Financial Tracking
- **Income** — Salary, freelance, dividends, rental, interest — with recurring income support
- **Expenses** — Categorized spending with payment method tracking and visual breakdowns
- **Dashboard** — Net worth overview, asset allocation, savings rate, monthly cash flow
- **Financial Status** — Complete picture: runway calculation, savings projections

### Platform
- **Authentication** — Supabase Auth with JWT validation, protected routes, session management
- **Dark Mode** — Full theme toggle with system preference detection
- **Responsive** — Mobile-first design with bottom navigation bar
- **Type-Safe** — End-to-end TypeScript with Prisma type generation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, ShadcnUI, TanStack Query v5 |
| Backend | NestJS 11, Prisma 7, PostgreSQL, Swagger/OpenAPI |
| Auth | Supabase (JWT), cookie-based sessions |
| Charts | Recharts |
| Build | Turborepo, pnpm |

## Architecture

```
FinanceLens/
├── apps/
│   ├── web/           # Next.js frontend (App Router, React 19)
│   ├── api/           # NestJS backend (Swagger docs at /api/docs)
│   └── docs/          # Documentation site
├── packages/
│   ├── eslint-config/    # Shared ESLint flat configs
│   └── typescript-config/ # Shared tsconfig presets
├── .github/workflows/  # CI pipeline
└── turbo.json
```

### Frontend Highlights
- App Router with server/client components
- AuthProvider context with Supabase SSR
- Typed API client with mock/real toggle (`NEXT_PUBLIC_USE_MOCK_DATA`)
- React Query for data fetching with optimistic cache invalidation
- Form validation with Zod schemas
- Toast notifications (Sonner)
- Loading, error, and empty states on every page

### Backend Highlights
- Global `AuthGuard` (all routes protected by default, `@Public()` for exemptions)
- Multi-tenant: every query scoped by `userId` with ownership verification
- `ValidationPipe` globally enabled with `class-validator` on all DTOs
- Swagger/OpenAPI documentation at `/api/docs`
- 14 Prisma models with proper relations, cascades, and indexing
- Live price integration: Yahoo Finance + precious metals with caching

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 9+

### Option 1: Mock Mode (No backend needed)

```bash
git clone <repo-url>
cd FinanceLens
pnpm install
pnpm dev --filter=web
```

The app runs with mock data at `http://localhost:3000`.

### Option 2: Full Stack

```bash
# 1. Set up environment
cp apps/web/.env.example apps/web/.env.local    # Fill in Supabase keys
cp apps/api/.env.example apps/api/.env          # Fill in DATABASE_URL + Supabase

# 2. Install and generate
pnpm install
pnpm --filter api prisma:generate
pnpm --filter api prisma db push

# 3. Run both apps
pnpm dev
```

| App | URL |
|-----|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001/api |
| Swagger | http://localhost:3001/api/docs |

### Switching Mock / Real Mode

In `apps/web/.env.local`:
```env
# Mock data (default — no backend needed)
NEXT_PUBLIC_USE_MOCK_DATA=true

# Real API
NEXT_PUBLIC_USE_MOCK_DATA=false
```

## API Endpoints

All endpoints require Bearer token authentication (except health check).

| Resource | Endpoints |
|----------|-----------|
| Stocks | `GET/POST /api/stocks`, `GET/PATCH/DELETE /api/stocks/:id`, `GET /api/stocks/summary` |
| ETFs | `GET/POST /api/etfs`, `GET/PATCH/DELETE /api/etfs/:id`, `GET /api/etfs/summary` |
| Eurobonds | `GET/POST /api/eurobonds`, `GET/PATCH/DELETE /api/eurobonds/:id`, `GET /api/eurobonds/summary` |
| Incomes | `GET/POST /api/incomes`, `GET/PATCH/DELETE /api/incomes/:id`, `GET /api/incomes/summary` |
| Expenses | `GET/POST /api/expenses`, `GET/PATCH/DELETE /api/expenses/:id`, `GET /api/expenses/summary` |
| Cash | `GET/POST /api/cash`, `GET/PATCH/DELETE /api/cash/:id`, `GET /api/cash/summary` |
| Gold | `GET/POST /api/gold`, `GET/PATCH/DELETE /api/gold/:id`, `GET /api/gold/summary` |
| Silver | `GET/POST /api/silver`, `GET/PATCH/DELETE /api/silver/:id`, `GET /api/silver/summary` |
| Dashboard | `GET /api/dashboard/overview`, `GET /api/dashboard/transactions` |
| Prices | `GET /api/precious-metals/gold/price`, `GET /api/yahoo-finance/quote/:symbol` |

Full interactive documentation available at `/api/docs` when the API is running.

## Development

```bash
pnpm dev          # Run all apps
pnpm build        # Build all apps
pnpm lint         # Lint all packages
pnpm check-types  # Type-check all packages
pnpm test         # Run backend tests
```

## License

MIT
