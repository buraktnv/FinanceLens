# FinanceLens

Kisisel finans durumu takip uygulamasi - Turkish personal finance tracking application.

## Project Overview

FinanceLens helps you track your personal finances during career transitions or irregular income periods. It answers key questions:

- Birikimlerim ne kadar sure yeter? (How long will my savings last?)
- Bu ay ne kadar harcadim? (How much did I spend this month?)
- Paramı nereye yatirmaliyim? (Where should I invest my money?)
- Ne kadar vergi odemem gerekiyor? (How much tax do I need to pay?)

## Tech Stack

### Monorepo
- **Turborepo** - Build system for monorepos
- **pnpm** - Fast, disk space efficient package manager

### Frontend (`apps/web`)
- **Next.js 16** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **ShadcnUI** - Accessible UI components
- **Lucide Icons** - Beautiful icons
- **Supabase SSR** - Authentication with cookie-based sessions

### Backend (`apps/api`)
- **Nest.js** - Progressive Node.js framework
- **Prisma ORM** - Type-safe database access
- **Supabase** - Authentication & Database
- **Redis** - Caching layer (planned)

## Project Structure

```
FinanceLens/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/             # App Router pages
│   │   │   ├── dashboard/   # Protected dashboard pages
│   │   │   ├── login/       # Login page
│   │   │   ├── register/    # Registration page
│   │   │   └── status/      # Financial status page
│   │   ├── components/ui/   # ShadcnUI components
│   │   ├── lib/
│   │   │   ├── api.ts       # API client with auth
│   │   │   ├── auth.tsx     # AuthProvider & hooks
│   │   │   └── supabase/    # Supabase client setup
│   │   └── middleware.ts    # Auth middleware
│   │
│   ├── api/                 # Nest.js backend
│   │   ├── prisma/          # Database schema
│   │   └── src/
│   │       ├── auth/        # Supabase JWT auth guard
│   │       ├── stocks/      # Stocks module
│   │       ├── eurobonds/   # Eurobonds module
│   │       ├── etfs/        # ETFs module
│   │       ├── incomes/     # Incomes module
│   │       ├── expenses/    # Expenses module
│   │       ├── dashboard/   # Dashboard aggregation
│   │       └── prisma/      # Prisma service
│   │
│   └── docs/                # Documentation site
│
├── packages/                # Shared packages (planned)
├── turbo.json
└── package.json
```

## Features

### Authentication
- Supabase Auth with email/password
- JWT token validation on API
- Protected routes with middleware
- Session persistence with cookies

### Dashboard (`/dashboard`)
- Total net worth overview
- Monthly income vs expenses
- Asset breakdown (stocks, ETFs, eurobonds)
- Spending patterns visualization

### Investments
- **Stocks** (`/dashboard/stocks`) - Stock portfolio with profit/loss tracking
- **Eurobonds** (`/dashboard/eurobonds`) - Bond investments with coupon tracking
- **ETFs** (`/dashboard/etfs`) - ETF holdings with distribution history

### Cash Flow
- **Incomes** (`/dashboard/incomes`) - Salary, rent, dividends, interest
- **Expenses** (`/dashboard/expenses`) - Categorized spending tracker

### Status Page (`/status`)
- Complete financial overview
- All assets in one view
- Loan tracking with interest rates

## API Endpoints

All endpoints require authentication via Bearer token (except health check).

### Stocks
- `GET /api/stocks` - List all stocks
- `GET /api/stocks/:id` - Get stock details
- `GET /api/stocks/summary` - Portfolio summary
- `POST /api/stocks` - Add new stock
- `PATCH /api/stocks/:id` - Update stock
- `DELETE /api/stocks/:id` - Remove stock

### Eurobonds
- `GET /api/eurobonds` - List all eurobonds
- `GET /api/eurobonds/:id` - Get eurobond details
- `GET /api/eurobonds/summary` - Portfolio summary
- `POST /api/eurobonds` - Add new eurobond
- `PATCH /api/eurobonds/:id` - Update eurobond
- `DELETE /api/eurobonds/:id` - Remove eurobond

### ETFs
- `GET /api/etfs` - List all ETFs
- `GET /api/etfs/:id` - Get ETF details
- `GET /api/etfs/summary` - Portfolio summary
- `POST /api/etfs` - Add new ETF
- `PATCH /api/etfs/:id` - Update ETF
- `DELETE /api/etfs/:id` - Remove ETF

### Incomes
- `GET /api/incomes` - List incomes (filterable)
- `GET /api/incomes/:id` - Get income details
- `GET /api/incomes/summary` - Monthly summary
- `POST /api/incomes` - Add new income
- `PATCH /api/incomes/:id` - Update income
- `DELETE /api/incomes/:id` - Remove income

### Expenses
- `GET /api/expenses` - List expenses (filterable)
- `GET /api/expenses/:id` - Get expense details
- `GET /api/expenses/summary` - Monthly summary by category
- `POST /api/expenses` - Add new expense
- `PATCH /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Remove expense

### Dashboard
- `GET /api/dashboard/overview` - Complete financial overview
- `GET /api/dashboard/transactions` - Recent transactions

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- Supabase account

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd FinanceLens

# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter api prisma generate
```

### Environment Setup

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Create `apps/api/.env`:
```env
DATABASE_URL=your-database-url
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### Database Setup

```bash
# Push schema to database
pnpm --filter api prisma db push

# Or run migrations
pnpm --filter api prisma migrate dev
```

### Development

```bash
# Run all apps
pnpm dev

# Run specific app
pnpm dev --filter=web
pnpm dev --filter=api
```

### Build

```bash
# Build all apps
pnpm build

# Build specific app
pnpm build --filter=web
pnpm build --filter=api
```

## Tax Calculations (Turkey)

The app includes Turkey-specific tax calculations:
- Eurobond withholding tax (stopaj)
- ETF capital gains tax
- Stock dividend taxation
- Rental income tax
- Interest income withholding

## Localization

- **Language:** Turkish (tr-TR)
- **Currency:** TRY (₺) with USD/EUR support
- **Date Format:** DD.MM.YYYY

## Architecture Decisions

### Authentication Flow
1. User logs in via Supabase Auth on frontend
2. Supabase returns JWT access token stored in cookies
3. Frontend API client includes token in Authorization header
4. API validates token with Supabase service
5. User ID extracted from token for data queries

### API Design
- RESTful endpoints with Nest.js
- Global AuthGuard protects all routes by default
- `@Public()` decorator for public endpoints
- `@CurrentUser('id')` decorator to access user ID
- Prisma for type-safe database queries

### Frontend Architecture
- Next.js App Router with server/client components
- AuthProvider context for auth state
- Lazy-loaded Supabase client (SSR-safe)
- Middleware for route protection and session refresh

## License

MIT
