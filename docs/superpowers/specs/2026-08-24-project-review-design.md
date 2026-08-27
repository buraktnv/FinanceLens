# FinanceLens Project Review & Upgrade — Design

- **Date:** 2026-08-24
- **Status:** Approved (user approved design sections §1–§5 and Approach A)
- **Scope:** Whole-project correctness pass, brand redesign, documentation set, agent skill file, CI/test wiring, single-file HTML review page.

## 1. Context

Three parallel review agents audited the monorepo. Key findings driving this work:

**Backend (`apps/api`, NestJS 11 + Prisma 7 + Supabase auth + fetch-based Yahoo client):**
- Wrong troy-ounce constant `28.3495` (avoirdupois) instead of `31.1035` → gold/silver TRY/gram overstated ~9% (`precious-metals.service.ts:17`).
- Eurobond valuation divides by 100 while DTO documents absolute price; dashboard uses yet another formula (`faceValue×quantity`) — three inconsistent valuations.
- Coupon income ignores frequency; percent-vs-fraction ambiguity (schema is `Decimal(5,4)` = fraction).
- Net worth sums USD + EUR + TRY assets without FX conversion.
- `propertyId` in incomes/expenses never ownership-checked (cross-tenant link, FK 500s).
- AuthGuard lazy user-create race (P2002 → 500); non-null `user.email!`.
- All asset modules use findFirst-then-write (TOCTOU, P2025 → 500); zero `$transaction` usage.
- Unvalidated query params → Prisma 500s; Yahoo proxy params unvalidated/unencoded; division by zero risk on `previousClose`.
- No fetch timeouts, upstream errors leaked, Swagger always on, no helmet/exception filter.
- Dead deps: ioredis/cache-manager stack declared but unused; hand-rolled Map cache instead.
- Only 3 test files; eurobond/dashboard/precious-metals logic untested.

**Frontend (`apps/web`, Next.js 16 App Router + TanStack Query v5 + shadcn copies):**
- Demo mode broken for writes (mock CRUD never mutates arrays); `USE_MOCK_DATA` defaults true.
- Enum casing mismatches mock↔UI↔forms (`Salary` vs `SALARY`, `FOOD` vs `GROCERIES`, `SEMI_ANNUAL` vs `SEMIANNUAL`).
- Five divergent `formatCurrency` implementations; hardcoded `$` where API returns TRY; en-US dates despite tr-TR/DD.MM.YYYY spec.
- Dark mode visually broken wherever raw Tailwind palette classes are used (~20+ locations incl. hardcoded chart colors).
- Full-page spinner loading states; inconsistent error states; silent $0 summary failures; unhandled delete errors.
- Mobile bottom nav exposes only 5 of 9 routes; `/status` unreachable on small screens.
- A11y gaps: no aria-labels, unlabeled inputs, `<html lang="en">`, non-keyboard SymbolSearch.
- Zero tests, no test runner installed.
- Login double-navigation race; `JSON.parse` crash risk in AuthProvider; status page crashes without optional chaining; price-fetch effect races.

**Repo meta:**
- Root README claims `pnpm test` which doesn't exist; turbo has no `test` task; CI has no api job/tests.
- CLAUDE.md stale + gitignored (phantom packages, Redis claim, missing routes).
- MOCK_DATA_GUIDE.md documents the wrong toggle method; web/docs READMEs are boilerplate; LICENSE year 2024.
- `packages/ui` is dead starter stub; docs app dev port collides with API (3001).

## 2. Goals

1. Fix every found bug, each locked by a unit test where logically testable.
2. Give the app a distinctive, portfolio-worthy brand identity with consistent dark mode.
3. Produce a documentation set that impresses a technical reviewer in 5 minutes.
4. Make `pnpm test` real: meaningful unit tests in api + web, wired through Turbo and CI.
5. Ship a self-contained `review/index.html` presenting findings (fixed/open), architecture docs, and roadmap — editable by the user.

## 3. Non-goals (deferred)

- Turkey tax engine (stopaj/dividend withholding calculations) — documented as future feature; only keep existing `taxWithheld` field consistent.
- Decimal-string money refactor across API (documented known limitation).
- Playwright e2e suite.
- Real Redis caching (dead deps removed instead).

## 4. Decisions (from brainstorm Q&A)

| Question | Decision |
|---|---|
| skills.md meaning | Agent skill file (`.opencode/skills/finance-lens/SKILL.md`) documenting project workflows |
| Bug scope | Fix all ~35 findings |
| UI depth | Brand redesign (new identity + landing showpiece + consistency fixes) |
| Test depth | Core unit tests (API Jest + Web Vitest) wired into turbo + CI |
| Review page | Single self-contained HTML at repo root `/review/index.html` |
| Cross-currency | Live FX→TRY via Yahoo chart endpoint, 15-min cached |
| Tax | Defer engine |
| Sequencing | Approach A: stabilize → beautify → document |

## 5. Design

### Phase 1A — Backend fixes + tests

**Calculations**
- `GRAMS_PER_TROY_OUNCE = 31.1035`; rename constant accordingly.
- Eurobonds: `currentValue = faceValue × quantity`; `cost = purchasePrice × quantity`; coupon rate treated as decimal fraction (0.0525 = 5.25%), documented in DTO examples; dashboard formula unified with service.
- Dividend totals subtract/include `taxWithheld` consistently.

**FX layer**
- `YahooFinanceService.getFxRate(pair: "USDTRY" | "EURTRY")`: reuse chart endpoint, parse meta.regularMarketPrice, 15-min Map cache (pattern from PreciousMetalsService).
- `DashboardService.getOverview`: convert USD/EUR-denominated stocks/ETFs/eurobonds to TRY before aggregation; response includes `fxRates: { USDTRY, EURTRY, fetchedAt }`. Cash/gold/silver already TRY-native (gold/silver gain explicit currency note).

**Tenancy & atomicity**
- Replace findFirst-then-update/delete with `updateMany({where:{id,userId}})` / `deleteMany` + count check → `NotFoundException`.
- Incomes/expenses: validate `propertyId` belongs to user → `BadRequestException`.

**Validation & robustness**
- `ParseIntPipe`/`ParseUUIDPipe` on params; `IsEnum`/`IsUUID`/`IsDateString` DTOs for filters; Yahoo proxy whitelist intervals `{1d,1wk,1mo,1h}` + encoded params + `previousClose` zero guard.
- `AuthGuard`: catch P2002 → refetch; guard against missing email.
- Fetch timeouts via `AbortSignal.timeout(10_000)`; sanitize upstream error messages; global exception filter; helmet; Swagger gated to non-production.

**Hygiene**
- Remove dead redis/cache-manager deps; `lint` script drops `--fix`; root `.prettierrc`; docs app dev port → 3002.

### Phase 1B — Frontend fixes + tests

- Demo mode: mocks mutate module-level arrays on create/update/delete; `USE_MOCK_DATA` defaults `false`; enum casing unified (`SALARY`, `MONTHLY`, `GROCERIES`, `SEMIANNUAL`…) across mock-data, forms, display maps.
- `lib/auth.tsx`: try/catch around JSON.parse; single navigation source of truth on login; signUp respects email-confirmation state.
- `lib/format.ts`: `formatCurrency(amount, currency)` (Intl tr-TR), `formatDate` DD.MM.YYYY, `formatPercent` Turkish placement — replaces all local copies; runway math unified to netWorth/expenses; "This Month" summaries pass current month; status page optional chaining; price-fetch effects get AbortController cleanup; delete mutations get error toasts.
- Dark-mode sweep: all raw palette classes → tokens; stock-chart theme-aware colors.
- A11y basics: aria-labels on icon buttons/inputs, `<html lang="tr">`, SymbolSearch Escape/arrows.
- Mobile nav: all routes reachable (scrollable nav or sheet).
- Remove dead code: `@repo/ui` dep from web, unused sidebar/form/use-mobile.
- Vitest setup; tests for format utils, label maps, api-client URL building, mock CRUD mutation behavior.

### Phase 2 — Brand redesign

- Token system in `globals.css`: emerald primary, amber accent, rose danger; semantic `success/warning/danger`; tabular numerals utility for money columns; light default + rich dark mode.
- Shared components extracted during sweep: `PageHeader`, `StatCard`, `EmptyState`, `ErrorState` (with retry), skeleton loaders per section, themed chart components.
- New charts (Recharts): portfolio allocation donut + expense-category bar on dashboard home.
- Landing page redesigned as portfolio showpiece: hero, feature grid of tracked asset classes, Turkish copy, demo-login CTA, footer with current year.

### Phase 3 — Docs & presentation

- Root README overhaul: CI badge, mermaid architecture diagram, accurate commands (working `pnpm test`), demo-mode guide, screenshots placeholders.
- Tracked `AGENTS.md` as canonical project guide (corrected content); local gitignored CLAUDE.md updated to point at it.
- `.opencode/skills/finance-lens/SKILL.md`: dev commands, demo mode, "add an asset module" recipe, currency/format conventions, test conventions.
- Fix MOCK_DATA_GUIDE.md, apps/web + apps/docs READMEs, eslint-config README package name, LICENSE year, brief CONTRIBUTING.md.
- `turbo.json` gains `test` task; root `pnpm test`; CI adds api job (lint/test/build) alongside web job.
- Generate `review/index.html` from final findings with fixed/open status chips; tabs Overview · Findings · Architecture · Testing · Roadmap.

## 6. Testing strategy

- **API (Jest):** precious-metals conversion math; eurobond valuation + coupon; dashboard aggregation incl. FX conversion; income/expense month arithmetic; AuthGuard branches (public bypass, verify fail, lazy create race); controller NotFound mapping; DTO rejection cases; FX rate parsing + cache expiry.
- **Web (Vitest):** `lib/format.ts` (multi-currency, tr-TR locale, percent), label maps completeness vs enums, api-client URL building, mock CRUD actually mutating fixtures.
- Wired: `turbo run test` from root; CI runs both suites.

## 7. Verification

Per phase gate: `pnpm lint && pnpm check-types && pnpm test && pnpm build` green.
Final manual smoke: demo login → add/edit/delete stock + eurobond persists → dashboard/status show TRY-normalized totals → dark/light toggle clean on every route → mobile nav reaches all routes → `review/index.html` opens standalone in browser.

## 8. Risks

- Yahoo FX endpoint availability → rates cached; graceful degradation keeps last-known rates; overview marks staleness.
- Broad frontend sweep may regress pages → token-only changes verified by typecheck + visual smoke; shared components reduce drift going forward.
- Eurobond semantics change alters stored-data interpretation → documented in DTO + docs; demo data regenerated accordingly.
