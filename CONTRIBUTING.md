# Contributing to FinanceLens

Thanks for your interest in contributing! This guide covers everything needed to get a PR merged.

## Setup

Prerequisites: **Node.js ≥ 20.19** and **pnpm 9** (`corepack enable` works too).

```bash
git clone https://github.com/buraktnv/FinanceLens.git
cd FinanceLens
pnpm install
pnpm --filter api prisma:generate   # required once after install

# For full-stack development, configure env files:
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

Without env files you can still run the web app in demo mode:
`NEXT_PUBLIC_USE_MOCK_DATA=true` in `apps/web/.env.local` (see [MOCK_DATA_GUIDE.md](MOCK_DATA_GUIDE.md)).

## Branches

Branch from `main` and use short kebab-case names describing the change:

```
fix/dashboard-fx-rates
feat/loan-tracking
docs/api-endpoints
```

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) — lowercase imperative summary,
no trailing period. Scope is optional but common for cross-cutting areas:

```
feat(web): allocation donut and expense category charts
fix(api): resolve lazy user-create race in AuthGuard
refactor(web): unified currency/date/percent formatting
chore: drop dead cache deps, prettier config, docs port 3002
ci: test pipelines for api and web via turbo
docs: overhaul readme, AGENTS.md, contributing and app docs
```

Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `ci`.

## Before Opening a PR

Run all three gates from the repo root — CI runs the same checks on Node 22:

```bash
pnpm lint           # ESLint everywhere, zero warnings tolerated
pnpm check-types    # TypeScript strict pass (api needs prisma:generate first)
pnpm test           # Jest (api) + Vitest (web)
```

Additional expectations:

- New API endpoints: DTO validation with `class-validator`, ownership scoping per the pattern in
  [AGENTS.md](AGENTS.md), Swagger decorators, and unit tests.
- New UI surfaces: use `lib/format.ts` formatters, semantic color tokens (no raw hex), Turkish UI text,
  loading/error/empty states, and matching mock functions if demo mode should support them.
- Prisma schema changes: regenerate the client and update mock data + enums consistently.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
