# FinanceLens Review & Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all ~35 audited bugs (each locked by tests), apply a brand redesign, wire tests into Turbo/CI, produce the documentation set + agent skill file + self-contained `review/index.html`.

**Architecture:** Monorepo (pnpm + Turorepo). Phase 1A stabilizes `apps/api` (NestJS 11, Prisma 7 driver-adapter, Supabase bearer auth, fetch-based Yahoo client). Phase 1B stabilizes `apps/web` (Next.js 16 App Router, TanStack Query v5, shadcn copies, demo/mock mode). Phase 2 re-themes via CSS tokens + shared components. Phase 3 documents final state and generates the review page.

**Tech Stack:** pnpm 9, Node ≥18, Turborepo, NestJS 11, Prisma 7 (`@prisma/adapter-pg`), Jest 30 (api), Next.js 16 / React 19 / Tailwind v4, TanStack Query v5, Recharts, Vitest (web, new), next-themes.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-24-project-review-design.md` (read before starting any task).
- Locale/currency contract: **tr-TR**, TRY default, dates **DD.MM.YYYY**, percent Turkish style `%12,5`.
- Coupon rates are **decimal fractions** (schema `Decimal(5,4)`); UI converts percent↔fraction at form boundary.
- All money aggregation happens in **TRY**; FX via `YahooFinanceService.getFxRate()`, 15-min cached.
- Never commit secrets; `.env` stays ignored. No new heavy deps without spec backing (helmet allowed; redis stack removed).
- Every task ends green: relevant test suite passes; commit per task.
- Windows/bash environment: quote paths, prefer `pnpm --filter <pkg> <script>`.

**Shared patterns (referenced by multiple tasks):**

*P1 — Atomic owned write (replaces findFirst-then-write in ALL asset services):*
```ts
async remove(userId: string, id: string): Promise<void> {
  const result = await this.prisma.stock.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new NotFoundException('Stock not found');
}
async update(userId: string, id: string, dto: UpdateStockDto) {
  const updated = await this.prisma.stock.updateMany({ where: { id, userId }, data: dto });
  if (updated.count === 0) throw new NotFoundException('Stock not found');
  return this.prisma.stock.findUnique({ where: { id } });
}
```
(Adapt model name per module. Same shape for gold/silver/eurobonds/etfs/cash/incomes/expenses.)

*P2 — Fetch with timeout (Yahoo + precious metals):*
```ts
const res = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { 'User-Agent': 'Mozilla/5.0' } });
if (!res.ok) throw new ServiceUnavailableException('Upstream price service unavailable');
```

---

## Phase 1A — Backend (`apps/api`)

### Task 1: Troy-ounce fix + conversion tests

**Files:** Modify `src/precious-metals/precious-metals.service.ts`; Create `src/precious-metals/precious-metals.service.spec.ts`.

- [ ] Step 1: Write failing tests: grams→troy conversion uses `31.1035`; `getPrices` returns TRY/gram = quote×multiplier÷31.1035; Map cache returns cached within TTL (jest fake timers).
- [ ] Step 2: `pnpm --filter api test -- precious-metals` → FAIL (constant is 28.3495).
- [ ] Step 3: Rename/fix constant to `GRAMS_PER_TROY_OUNCE = 31.1035`, use it in both gold and silver conversions.
- [ ] Step 4: Tests PASS. Commit: `fix(api): correct troy-ounce constant for precious metal pricing`.

### Task 2: Eurobond valuation + coupon semantics

**Files:** Modify `src/eurobonds/eurobonds.service.ts`, `src/dashboard/dashboard.service.ts`, `src/eurobonds/dto/create-eurobond.dto.ts`, `src/eurobonds/dto/update-eurobond.dto.ts`; Create `src/eurobonds/eurobonds.service.spec.ts`.

- [ ] Step 1: Failing tests: `currentValue = faceValue × quantity`; `totalCost = purchasePrice × quantity` (no ÷100); `annualCouponIncome = faceValue × quantity × couponRate` with rate stored as fraction (0.0525 → 5.25% effective); summary math on seeded rows incl. zero-face edge.
- [ ] Step 2: Run → FAIL.
- [ ] Step 3: Fix service formulas; make `dashboard.service.ts` eurobond breakdown use `faceValue × quantity`; update DTO `@ApiProperty` examples/docs to state fraction convention (example `0.0525`) and absolute purchase price.
- [ ] Step 4: PASS. Commit: `fix(api): consistent eurobond valuation (faceValue×qty) and fraction coupon rate`.

### Task 3: Dividend totals respect taxWithheld

**Files:** Modify `src/stocks/stocks.service.ts`; Modify `src/stocks/stocks.service.spec.ts`.

- [ ] Step 1: Failing test: portfolio summary `totalDividends` equals gross − withheld (sum `amount - taxWithheld`).
- [ ] Step 2: FAIL. Step 3: fix aggregation. Step 4: PASS. Commit: `fix(api): net dividends after withholding in stock summary`.

### Task 4: FX rate service in YahooFinanceService

**Files:** Modify `src/yahoo-finance/yahoo-finance.service.ts`; Create `src/yahoo-finance/fx-rate.spec.ts` (or extend existing yahoo spec).

**Produces:** `getFxRate(pair: 'USDTRY' | 'EURTRY'): Promise<{ rate: number; fetchedAt: string }>` — chart endpoint `https://query1.finance.yahoo.com/v8/finance/chart/${pair}=X`, reads `chart.result[0].meta.regularMarketPrice`; static Map cache 15 min; P2 timeout; throws `ServiceUnavailableException` on bad payload.

- [ ] Step 1: Failing tests: parses meta price; caches (second call no fetch); cache expiry via fake timers; invalid payload → ServiceUnavailableException.
- [ ] Step 2: FAIL. Step 3: implement. Step 4: PASS. Commit: `feat(api): cached FX rates from Yahoo for TRY normalization`.

### Task 5: Dashboard TRY-normalized overview

**Files:** Modify `src/dashboard/dashboard.service.ts`; Create `src/dashboard/dashboard.service.spec.ts`.

- [ ] Step 1: Failing tests: mixed USD stock + EUR eurobond + TRY cash aggregates into single TRY net worth using injected fx rates (mock `YahooFinanceService.getFxRate`); response includes `fxRates: { USDTRY, EURTRY, fetchedAt }`; FX failure → falls back to last-known or rate=1 with `stale: true` flag rather than 500.
- [ ] Step 2: FAIL. Step 3: implement conversion helper inside dashboard service (per-item `currency` field drives multiplier; cash/gold/silver are TRY-native). Step 4: PASS. Commit: `feat(api): TRY-normalized net worth with live FX rates`.

### Task 6: Atomic owned writes + propertyId tenancy

**Files:** Modify all 7 asset services (`stocks`, `eurobonds`, `etfs`, `cash`, `gold`, `silver`, plus incomes/expenses update/remove) per **Pattern P1**; Modify `src/incomes/incomes.service.ts`, `src/expenses/expenses.service.ts` for `propertyId` ownership check; extend their specs.

- [ ] Step 1: Failing tests per service: foreign-owned id update/delete → NotFoundException; nonexistent id → NotFoundException; incomes/expenses with another user's `propertyId` → BadRequestException.
- [ ] Step 2: FAIL. Step 3: apply P1 everywhere; property check = `prisma.property.findFirst({where:{id,userId}})` else BadRequest. Step 4: PASS. Commit: `refactor(api): atomic owned writes; validate property ownership`.

### Task 7: Input validation hardening

**Files:** Modify controllers/DTOs: `dashboard.controller.ts` (`ParseIntPipe` + min/max on limit/month/year), `incomes.controller.ts`, `expenses.controller.ts` (same), `yahoo-finance.controller.ts` + `service.ts` (whitelist `interval ∈ {1d,1wk,1mo}`; encode params; guard `previousClose > 0` before percent division), incomes/expenses filter DTOs (`IsEnum(IncomeType/ExpenseCategory/PaymentMethod)` optional, `IsDateString`), `ParseUUIDPipe` on every `:id` param repo-wide.

- [ ] Step 1: Failing e2e-style controller tests (supertest or direct controller calls): garbage `month=abc` → 400; unknown category string → 400; `interval=../x` → 400.
- [ ] Step 2: FAIL. Step 3: implement. Step 4: PASS. Commit: `fix(api): strict query/param validation across controllers`.

### Task 8: AuthGuard race + null-safety

**Files:** Modify `src/auth/auth.guard.ts`; Create/extend `src/auth/auth.guard.spec.ts`.

- [ ] Step 1: Failing tests: public route bypass; invalid token → 401; concurrent lazy-create resolves (mock prisma create throwing P2002 → refetch succeeds); missing email → 401 (no undefined write).
- [ ] Step 2: FAIL. Step 3: catch Prisma P2002 around create → retry findUnique; validate `email` presence. Step 4: PASS. Commit: `fix(api): resolve lazy user-create race in AuthGuard`.

### Task 9: Robustness: timeouts, filters, helmet, swagger gating

**Files:** Modify `src/main.ts`, `src/yahoo-finance/yahoo-finance.service.ts`, `src/precious-metals/precious-metals.service.ts` (apply P2 + stop leaking upstream messages); Create `src/common/http-exception.filter.ts` (global catch-all → sanitized JSON `{statusCode,message}`); add `helmet` dep; Swagger only when `NODE_ENV !== 'production'`.

- [ ] Step 1: Build + existing e2e green; unit-test filter maps unknown error → 500 sanitized body.
- [ ] Step 2: Implement. Step 3: `pnpm --filter api build && pnpm --filter api test`. Step 4: Commit: `chore(api): timeouts, global exception filter, helmet, prod-gated swagger`.

### Task 10: API hygiene

**Files:** Modify `apps/api/package.json` (remove `ioredis`, `cache-manager`, `cache-manager-ioredis-yet`, `@nestjs/cache-manager`; `lint` drops `--fix`); Create root `.prettierrc` (semi:true, singleQuote:true, trailingComma:'all'); Modify `apps/docs/package.json` dev/start ports → 3002.

- [ ] Step 1: `pnpm install` after dep removal; `pnpm --filter api lint` (no mutation); docs app boots on 3002.
- [ ] Step 2: Commit: `chore: drop dead cache deps, prettier config, docs port 3002`.

---

## Phase 1B — Frontend (`apps/web`)

### Task 11: Vitest setup + `lib/format.ts` (TDD)

**Files:** Create `vitest.config.ts`, `lib/format.ts`, `lib/__tests__/format.test.ts`; Modify `apps/web/package.json` (add vitest + `test` script; devDeps `vitest`, `@vitejs/plugin-react` not needed for pure utils — plain vitest).

**Produces:** `formatCurrency(amount:number|string, currency='TRY'):string` (Intl tr-TR, currency-aware symbol, 2 decimals); `formatDate(input:string|Date):string` DD.MM.YYYY; `formatPercent(value:number):string` → `%12,50`.

- [ ] Step 1: Failing tests: USD/EUR/GBP/TRY outputs, invalid amount → '—', percent rounding, date parsing ISO + Date.
- [ ] Step 2: `pnpm --filter web test` → FAIL. Step 3: implement. Step 4: PASS. Commit: `feat(web): canonical tr-TR formatters with vitest`.

### Task 12: Adopt formatters everywhere

**Files:** Delete local `formatCurrency` in `app/dashboard/{page,stocks,cash,gold,silver,eurobonds,etfs,incomes,expenses}/page.tsx`, `app/status/page.tsx`; import from `lib/format`; pass record currency where available (stocks/eurobonds/etfs/incomes/cash rows); replace raw `$`+`toLocaleString()` occurrences; unify percent placement; dates → `formatDate`; runway = `netWorth/expenses` on both pages; expenses/incomes "This Month" call `getSummary(year, month)` with current date.

- [ ] Step 1: Mechanical sweep page-by-page; typecheck after each batch (`pnpm --filter web check-types`).
- [ ] Step 2: Manual grep gate: `rg "\$\\\\?\\{|toLocaleDateString\\(\"en-US\"\\)" apps/web/app` → 0 hits.
- [ ] Step 3: Commit: `refactor(web): unified currency/date/percent formatting`.

### Task 13: Demo mode made functional

**Files:** Modify `lib/api-mock.ts` (CRUD mutates module arrays; `USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'`), `lib/mock-data.ts` + display maps in incomes/expenses pages (single casing: `SALARY/FREELANCE/RENTAL_INCOME/DIVIDEND/INTEREST/OTHER`, `MONTHLY/QUARTERLY/SEMIANNUAL/ANNUAL`, categories incl. `GROCERIES`; forms submit matching keys — fix `FOOD→GROCERIES`, `SEMI_ANNUAL→SEMIANNUAL`); Create `lib/__tests__/api-mock.test.ts`.

- [ ] Step 1: Failing tests: create→list contains item; update persists; delete removes; default flag false without env var.
- [ ] Step 2: FAIL. Step 3: implement mutations + casing unification (update label maps together). Step 4: PASS. Commit: `fix(web): functional demo mode with consistent enums`.

### Task 14: Auth flow fixes

**Files:** Modify `lib/auth.tsx` (try/catch JSON.parse → null; `signIn` does NOT push; callers push; `signUp` checks session existence → if none, land on `/login?message=confirm-email`), `app/login/page.tsx` (owns navigation to `redirectTo || '/dashboard'`).

- [ ] Step 1: Unit-test pure helpers where extractable (parseDemoUser safe-parse). 
- [ ] Step 2: Implement. Step 3: typecheck + manual smoke via demo login. Commit: `fix(web): auth provider crash-safety and single navigation owner`.

### Task 15: Data-correctness sweep

**Files:** Modify `app/status/page.tsx` (optional chaining on `overview.breakdown.*`), all 7 asset pages (`deleteMutation.onError` → sonner error toast + close dialog), `app/dashboard/stocks/page.tsx` + `gold/page.tsx` + `silver/page.tsx` (price-fetch effect: `let cancelled=false` in effect body + cleanup sets true; interval keyed `[stocks.length]`), `app/dashboard/page.tsx` (handle recent-transactions error state; caption "Toplam Varlık" not "Net worth").

- [ ] Step 1: Apply; typecheck. Step 2: Commit: `fix(web): error surfacing, race-free price fetching, status-page guards`.

### Task 16: Dark-mode, a11y, mobile nav, dead code

**Files:** Sweep raw classes → tokens: `bg-gray-50/100` → `bg-muted/30` etc.; badge palettes → shadcn badge variants or token pairs defined in Task 17 (use temporary `bg-primary/10 text-primary` until Task 17 lands); `symbol-search.tsx` (`bg-popover`, keyboard: Escape closes, arrows move active index, Enter selects); icon buttons get `aria-label`; search inputs get labels; `layout.tsx` `<html lang="tr">`; `app/dashboard/layout.tsx` mobile nav renders all routes (horizontal scroll strip or Sheet menu) incl. `/status` link; delete `components/ui/sidebar.tsx`, `components/ui/form.tsx`, `hooks/use-mobile.ts`, remove `@repo/ui` from `apps/web/package.json`.

- [ ] Step 1: Grep gates: `rg "bg-gray-|bg-white\b|text-gray-" apps/web/app` → 0 hits (excluding node_modules); `lang="tr"` present.
- [ ] Step 2: typecheck + dark-mode visual smoke. Commit: `fix(web): tokenized dark mode, a11y basics, complete mobile nav`.

---

## Phase 2 — Brand redesign

### Task 17: Design token system

**Files:** Modify `app/globals.css`: emerald primary (`oklch(0.596 0.145 163)` light / brighter dark variant), amber accent, rose destructive, add `--success/--warning/--danger` (+foreground variants) wired to Tailwind v4 `@theme`; add utility class `.tabular-nums` usage note → apply `tabular-nums` on stat values/table numeric cells during Task 18 adoption.

- [ ] Step 1: Tokens defined for light+dark; contrast-check primary-on-background ≥4.5:1 both modes.
- [ ] Step 2: Visual smoke light/dark. Commit: `feat(web): emerald brand token system with semantic status colors`.

### Task 18: Shared components + page adoption

**Files:** Create `components/shared/stat-card.tsx`, `page-header.tsx`, `empty-state.tsx`, `error-state.tsx` (props: `title, description?, onRetry`), skeleton composites per page; adopt across all dashboard pages replacing bespoke loading/error/empty JSX and duplicated delete-confirm blocks where trivially shareable; numeric cells get `tabular-nums`; badges use `success/warning/danger` tokens (income=success, expense=danger, neutral=muted).

- [ ] Step 1: Components + Storybook-free visual smoke on stocks page first, then sweep remaining pages.
- [ ] Step 2: typecheck + full-page smoke each route. Commit: `refactor(web): shared page primitives, consistent states`.

### Task 19: Charts

**Files:** Create `components/charts/allocation-donut.tsx`, `components/charts/category-bar.tsx` (Recharts, theme-token colors, Turkish tooltips, empty-state fallback); mount on `app/dashboard/page.tsx` fed from overview breakdown + expense summary.

- [ ] Step 1: Render with demo data incl. zero-values case. Step 2: Commit: `feat(web): allocation donut and expense category charts`.

### Task 20: Landing page showpiece

**Files:** Rewrite `app/page.tsx` (+ `components/landing/*` sections: hero, stats strip, feature grid of 9 tracked asset classes with icons, how-it-works, CTA demo-login + register, footer year dynamic). Turkish copy; metadata title/description Turkish in `layout.tsx`.

- [ ] Step 1: Build + desktop/mobile smoke; logged-in redirect preserved.
- [ ] Step 2: Commit: `feat(web): branded landing page showcase`.

---

## Phase 3 — Docs, skills, CI, review page

### Task 21: Test wiring + CI

**Files:** Modify `turbo.json` (add `"test": { "dependsOn": ["^build"] }` pipeline entry), root `package.json` (`"test": "turbo run test"`), `.github/workflows/ci.yml` (new `api` job: install, prisma generate, lint, test, build; web job gains `pnpm --filter web test`).

- [ ] Step 1: `pnpm test` runs api jest + web vitest from root. Step 2: Validate workflow YAML (`node -e "require('js-yaml')"`-style parse or actionlint if present). Step 3: Commit: `ci: test pipelines for api and web via turbo`.

### Task 22: Documentation set

**Files:** Rewrite root `README.md` (badges incl. CI, mermaid architecture diagram, accurate quickstart with working `pnpm test`, demo mode section, endpoint table refresh, screenshots placeholder block); Create `AGENTS.md` (accurate monorepo guide: real packages/routes/env vars/conventions — replaces stale CLAUDE.md content); Modify local `CLAUDE.md` → short pointer to AGENTS.md; Fix `MOCK_DATA_GUIDE.md` (env-var method); Replace `apps/web/README.md` + `apps/docs/README.md` boilerplate; Fix `packages/eslint-config/README.md` package name; `LICENSE` year → 2026; Create `CONTRIBUTING.md` (setup, branch/test/lint conventions, commit style observed in git log).

- [ ] Step 1: Verify every command in README actually runs (`pnpm install/dev/build/test/lint`). Step 2: Commit: `docs: overhaul readme, AGENTS.md, contributing and app docs`.

### Task 23: Agent skill file

**Files:** Create `.opencode/skills/finance-lens/SKILL.md` (frontmatter name/description; contents: dev commands, demo-mode explanation, "add an asset module" recipe referencing Pattern P1 backend + frontend page/form/query-invalidation checklist, currency/format conventions pointing at `lib/format.ts`, test conventions).

- [ ] Step 1: Write; verify frontmatter format matches other opencode skills. Step 2: Commit: `chore: finance-lens agent skill`.

### Task 24: Review page + final verification

**Files:** Create `review/index.html` (self-contained: inline CSS/JS, no CDN deps; tabs Overview · Findings · Architecture · Testing · Roadmap; findings table lists all audit items with severity chips and FIXED/OPEN status reflecting post-fix reality; link back to GitHub repo path relative).

- [ ] Step 1: Generate from audit results (statuses: all Phase 1/2 items FIXED unless genuinely deferred — deferred items OPEN with rationale).
- [ ] Step 2: Open standalone in browser to verify tabs/scroll/responsive.
- [ ] Step 3: Full gates: `pnpm lint && pnpm check-types && pnpm test && pnpm build`.
- [ ] Step 4: Manual smoke checklist (demo CRUD persistence, TRY totals w/ FX, dark/light all routes, mobile nav completeness).
- [ ] Step 5: Commit: `docs: standalone review page with audit findings and roadmap`.

## Self-Review Notes

- Spec coverage: §5 Phase1A→Tasks1–10; Phase1B→11–16; Phase2→17–20; Phase3→21–24. Testing §6 embedded per-task + Task21 wiring. Verification §7 → Task24 gates. Risks: FX staleness handled in Task 5 fallback; eurobond semantics documented Task 2.
- Type consistency: `getFxRate` signature produced in Task 4, consumed Task 5; formatter names produced Task 11 consumed Task 12; token names produced Task 17 referenced Task 18.
