# FinanceLens Docs (`apps/docs`)

Minimal Next.js documentation site for FinanceLens. Runs on **port 3002**.

## Getting Started

From the repo root:

```bash
pnpm install
pnpm dev --filter=docs
```

Open http://localhost:3002.

## Scripts

```bash
pnpm build --filter=docs       # production build
pnpm lint --filter=docs        # ESLint (--max-warnings 0)
pnpm check-types --filter=docs # next typegen + tsc --noEmit
```

The primary developer documentation lives in the root [README.md](../../README.md) and
[AGENTS.md](../../AGENTS.md); this app is a small hosted summary page.
