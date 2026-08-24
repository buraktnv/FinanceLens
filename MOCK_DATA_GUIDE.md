# Mock Data Guide (Demo Mode)

FinanceLens can run entirely on in-memory mock data — useful for demos, portfolio showcases, and
UI development without a backend.

## Overview

The web app supports two modes:

1. **Real API mode** (default) — talks to the NestJS backend at `NEXT_PUBLIC_API_URL`
2. **Demo mode** — all data served from `apps/web/lib/mock-data.ts` in memory; no backend needed

## How to Switch Between Modes

Demo mode is controlled by the **`NEXT_PUBLIC_USE_MOCK_DATA` environment variable** in
`apps/web/.env.local`:

### Enable demo mode

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

### Use the real API (default)

```env
NEXT_PUBLIC_USE_MOCK_DATA=false
```

or simply remove the variable — anything other than the exact string `true` disables demo mode.
Restart `pnpm dev` after changing `.env.local` so Next.js picks up the new value.

The flag is read once in `apps/web/lib/api-mock.ts`:

```typescript
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
```

`apps/web/lib/api.ts` checks this flag and delegates every call to the mock implementation when it
is enabled. No component code changes are needed.

## What Demo Mode Provides

Mock data (`apps/web/lib/mock-data.ts`) includes:

- Dashboard overview with realistic financial figures
- 5 stock positions (AAPL, MSFT, GOOGL, TSLA, NVDA) with mock Yahoo quotes
- 3 ETF holdings (VOO, VTI, VXUS)
- 2 eurobond positions with coupon tracking
- 4 cash accounts across currencies
- 2 gold holdings and 1 silver holding with mock metal prices
- Income and expense records with summaries

All CRUD operations work against in-memory state: forms create/update/delete mock records,
simulated with a ~300 ms network delay for a realistic feel. **Changes are not persisted** —
refreshing the page resets to the default dataset.

## Notes

- The API key (`NEXT_PUBLIC_API_URL`) is irrelevant in demo mode; no requests leave the browser.
- Keep enum values in mock data identical to the Prisma enums (`USD`, `SALARY`, `MARKET`, …).
- When adding a new API surface, add a matching mock function in `apps/web/lib/api-mock.ts`
  and keep `api.ts` delegating through the same interface.
- Unit tests for the toggle behavior live in `apps/web/lib/__tests__/api-mock.test.ts`.
