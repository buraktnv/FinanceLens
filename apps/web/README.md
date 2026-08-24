# FinanceLens Web (`apps/web`)

Next.js 16 frontend for FinanceLens — React 19, Tailwind CSS v4, ShadcnUI, TanStack Query.
Runs on **port 3000**.

## Getting Started

From the repo root:

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev --filter=web
```

Open http://localhost:3000.

### Environment Variables (`.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend base URL (default `http://localhost:3001/api`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL — required for auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key — required for auth |
| `NEXT_PUBLIC_USE_MOCK_DATA` | `"true"` enables demo mode on mock data (default off) |

Demo mode lets you explore the full UI without running the API. See the root
[MOCK_DATA_GUIDE.md](../../MOCK_DATA_GUIDE.md).

## Scripts

```bash
pnpm dev --filter=web      # dev server on :3000
pnpm build --filter=web    # production build
pnpm lint --filter=web     # ESLint (--max-warnings 0)
pnpm check-types --filter=web  # next typegen + tsc --noEmit
pnpm test --filter=web     # Vitest unit tests (formatters, mock layer, chart data)
```

## Structure

- `app/` — App Router pages: `/`, `/login`, `/register`, `/dashboard/*`, `/status`
- `components/` — ShadcnUI primitives (`ui/`) and feature components
- `lib/` — API client (`api.ts`), demo mode (`api-mock.ts`, `mock-data.ts`),
  formatters (`format.ts`), auth context (`auth.tsx`), Supabase clients

UI text is Turkish (tr-TR); all currency/date formatting goes through `lib/format.ts`.
