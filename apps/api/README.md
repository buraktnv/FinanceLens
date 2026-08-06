# FinanceLens API

NestJS backend for the FinanceLens personal finance tracking application.

## Tech Stack

- **NestJS 11** — Progressive Node.js framework
- **Prisma 7** — Type-safe ORM with PostgreSQL adapter
- **Supabase** — Authentication via JWT verification
- **class-validator** — Input validation on all DTOs
- **Swagger/OpenAPI** — Auto-generated API docs at `/api/docs`
- **Yahoo Finance** — Live stock price integration

## Getting Started

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter api prisma:generate

# Push schema to database
pnpm --filter api prisma db push

# Start development server (port 3001)
pnpm dev --filter=api
```

## Environment Variables

Create `apps/api/.env` (see `.env.example`):

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## API Documentation

Once the server is running, visit:
- **Swagger UI:** http://localhost:3001/api/docs
- **Health Check:** http://localhost:3001/api

## Architecture

### Authentication
- Global `AuthGuard` protects all routes by default
- Verifies Supabase JWT from `Authorization: Bearer <token>` header
- `@Public()` decorator exempts specific routes (e.g., health check)
- `@CurrentUser('id')` decorator extracts user ID from the validated token
- Read-on-miss pattern: user record is cached in local DB after first request

### API Design
- RESTful endpoints with global `/api` prefix
- All endpoints scoped by `userId` (multi-tenant isolation)
- Ownership verification before update/delete (no IDOR)
- `ValidationPipe` with `whitelist` and `transform` enabled globally
- All DTOs decorated with `class-validator` rules and `@ApiProperty` metadata

### Modules

| Module | Endpoints | Description |
|--------|-----------|-------------|
| stocks | 6 (+summary) | Stock portfolio with dividends |
| etfs | 6 (+summary) | ETF holdings with distributions |
| eurobonds | 6 (+summary) | Bond investments with coupons |
| incomes | 6 (+summary) | Income tracking with filters |
| expenses | 6 (+summary) | Expense tracking by category |
| cash | 6 (+summary) | Bank account balances |
| gold | 6 (+summary) | Gold holdings |
| silver | 6 (+summary) | Silver holdings |
| dashboard | 2 | Net worth overview + transactions |
| precious-metals | 2 | Live gold/silver prices (15-min cache) |
| yahoo-finance | 3 | Stock search, quotes, historical data |

### Database Schema
14 Prisma models with proper relations, cascade deletes, and indexing.
Key tables: `User`, `Stock`, `ETF`, `Eurobond`, `Income`, `Expense`, `Cash`, `Gold`, `Silver`, `Property`, `Loan`.

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## License

MIT
