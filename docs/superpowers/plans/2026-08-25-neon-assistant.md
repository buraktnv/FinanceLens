# Neon Palette, Mobile Nav & AI Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Swap to the neon brand palette (#70FFD2/#FFFC8C/#FFCC4D/#FF9137), restyle mobile nav with an assistant CTA, and ship a hybrid AI assistant (deterministic FIRE projection engine + curated multi-region history matcher + optional BYO-key LLM narration).

**Architecture:** Pure TS engine + datasets in `apps/web/lib/assistant/*` compute everything; Next.js route handler `app/api/assistant/route.ts` proxies optional LLM narration using a client-supplied key header (never stored); UI lives in `components/assistant/*` mounted from the dashboard layout via a floating button + sheet.

**Tech Stack:** Next.js 16 App Router, Tailwind v4 tokens, TanStack Query, Recharts, Vitest (node env), fetch-based provider adapters (no new deps).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-25-neon-assistant-design.md`.
- Palette verbatim: primary mint `#70FFD2`, highlight yellow `#FFFC8C`, warning gold `#FFCC4D`, accent orange `#FF9137`; danger stays rose; status colors remain fill-token pairs (`bg-x/15`), never bare text on page backgrounds.
- Light-mode contrast: mint fills carry dark-emerald foreground; mint-as-text only in dark mode or via `--primary-strong` (deeper mint).
- All assistant numbers come ONLY from the engine; LLM narrates, never computes.
- tr-TR copy with diacritics; formatting via `lib/format.ts`; Prisma-exact enums.
- No new runtime deps. Every task ends green: `pnpm --filter web test` (+ lint/check-types at phase ends); conventional commits.
- Worktree: `D:\projects\FinanceLens\.worktrees\review-upgrade`, branch `review-upgrade`.

---

### Task 1: Token swap

**Files:** Modify `apps/web/app/globals.css`.

**Produces:** tokens `--primary: #70FFD2`, `--primary-strong` (deep mint ≈ oklch equivalent of `#0e9f7a` family), `--accent: #FF9137`, `--warning: #FFCC4D`, chart order `[mint, gold, orange, yellow, …]`, foregrounds adjusted so light-mode primary fills use dark-emerald text; both `:root` and `.dark`.

- [ ] Verify both modes' primary-on-background ≥4.5:1 (mint is light: dark mode text-on-bg fine; light mode uses primary-strong for text, dark fg on mint fills) — document computed ratios in commit body.
- [ ] Grep sweep: any literal emerald hex/oklch leftovers in globals.css removed; landing CTA band/badges still reference tokens only.
- [ ] Gates: `pnpm --filter web lint && pnpm --filter web check-types && pnpm --filter web build`.
- [ ] Commit: `feat(web): neon brand token system`.

### Task 2: Mobile nav restyle

**Files:** Modify `apps/web/app/dashboard/layout.tsx`.

- [ ] Floating pill bar: `fixed bottom inset-x mx-auto max-w-md rounded-full border bg-card/90 backdrop-blur px-2 py-1.5` + safe-area margin; items = icon+label compact buttons; active = `bg-primary/15 text-primary-strong ring-1 ring-primary/40 shadow-[0_0_14px_-2px_var(--primary)]`.
- [ ] Center raised circular assistant button (Sparkles icon) between left/right halves: gradient ring `bg-gradient-to-br from-primary to-accent p-[2px]`, inner circle `bg-card`, `-translate-y-4`. Clicking toggles assistant open state (Task 6 provides context — for now wire a placeholder `useState` lifted later; export `useAssistantOpen` stub from `components/assistant/provider.tsx` created in Task 6; to keep Task 2 self-contained, create minimal `components/assistant/provider.tsx` now with context {open, setOpen} only).
- [ ] `/status` remains reachable (strip item).
- [ ] Manual smoke on dev server :3005 (mobile viewport): glow pill switches per route, button visually raised.
- [ ] Commit: `feat(web): floating neon mobile nav with assistant CTA`.

### Task 3: Projection engine (TDD)

**Files:** Create `apps/web/lib/assistant/engine.ts`, `apps/web/lib/assistant/__tests__/engine.test.ts`.

**Produces (exact):**
```ts
export interface AssistantSnapshot { netWorthTRY: number; monthlySavings: number; monthlyExpenses: number }
export interface Assumptions { annualReturnPct: number; annualInflationPct: number; monthlySavingOverride?: number | null; expenseReductionPct?: number }
export interface ProjectionPoint { dateISO: string; portfolioTRY: number }
export interface ProjectionResult {
  fireNumberTRY: number; fireDateISO: string | null; yearsToFI: number | null;
  savingsRate: number; alreadyFI: boolean;
  series: ProjectionPoint[];            // monthly, cap 600 months
  milestones: { label: string; dateISO: string }[]; // 25%→100% of fireNumber
}
export const projectFire = (s: AssistantSnapshot, a: Assumptions): ProjectionResult
```
Monthly real return `r = (1+return)/(1+inflation) - 1`; expenses reduced by `expenseReductionPct`; savings override replaces monthlySavings; step: `p = p*(1+r) + saving`; fireNumber = `(expenses*12)/0.04`; stop when `p >= fireNumber` or 600 months.

- [ ] Failing tests: steady case (10k net, save 5k/mo, expenses 20k → fireNumber 6,000,000; assert first milestone date + fireDate exists < 600mo); already-FI; negative net worth (series starts negative, still converges); zero expenses → fireNumber 0 + alreadyFI true; override respected; expenseReduction lowers fireNumber; savingsRate = savings/(savings+expenses) guarded vs div0; series capped at 600 & dates are month-increments ISO.
- [ ] RED → implement → GREEN (`pnpm --filter web test -- engine`).
- [ ] Commit: `feat(web): deterministic FIRE projection engine`.

### Task 4: History datasets + matcher (TDD)

**Files:** Create `lib/assistant/history/types.ts`, `{tr,us,global}.ts`, `matcher.ts`, `__tests__/history.test.ts`.

**Produces (exact):**
```ts
export interface HistoryEvent { id: string; region: 'TR'|'US'|'GLOBAL'; year: number; title: string; type: 'crisis'|'boom'|'stagflation'; drawdownPct: number; recoveryMonths: number|null; lesson: string }
export interface MatchInput { horizonYears: number; realReturnPct: number; currencyVolatility: 'low'|'high' } // high for TRY-like regimes
export function matchHistory(events: HistoryEvent[], input: MatchInput, limit?: number): { event: HistoryEvent; score: number }[]
export const ALL_EVENTS: HistoryEvent[] // concat of the three datasets (~20)
```
Datasets: TR: 1994 crisis, 2001 banking crisis, 2018 lira shock, 2021–23 inflation surge; US: 1970s stagflation, 2000 dot-com, 2008 GFC, 2020 COVID crash+recovery; GLOBAL: 1992 ERM, 2010–12 eurozone, 1990s Japan lost decade, 1987 Black Monday. (Each with realistic drawdown/recovery values.)
Scoring: crisis-type matches low/negative real-return inputs; boom matches high real-return; high volatility boosts TR events weight; horizon similarity ±5y bonus; sort desc, default limit 3.

- [ ] Failing tests: dataset integrity (unique ids, regions valid, drawdown ranges sane); matcher orders stagflation-first for (low horizon, ~0 real, high vol); returns ≤ limit; score monotonicity sanity.
- [ ] RED → GREEN → Commit: `feat(web): curated history datasets with scenario matcher`.

### Task 5: Intent router (TDD)

**Files:** Create `lib/assistant/router.ts`, `__tests__/router.test.ts`.

**Produces (exact):**
```ts
export type Intent =
 | { kind: 'greeting' } | { kind: 'fire-date' }
 | { kind: 'save-what-if'; monthlyAmount: number }
 | { kind: 'expense-what-if'; reductionPct: number }
 | { kind: 'crash-scenario'; eventId?: string }
 | { kind: 'help' };
export function detectIntent(text: string): Intent
```
Turkish keyword matching (case-insensitive, ASCII-tolerant): greetings (merhaba/selam/ne yapıyorsun), "ne zaman/özgür/fire", save patterns ("ayda X", "X biriktir", number+k parse "15k"→15000, "5 bin"→5000), expense ("gider/im %Y düşse"), crash ("kriz","2008","çökerse", year extraction), help fallback.

- [ ] Table-driven failing tests (~15 rows incl. "ayda 15k biriktirirsem?", "giderlerim %20 düşse?", "2008 gibi bir kriz olsaydı?", garbage → help).
- [ ] RED → GREEN → Commit: `feat(web): assistant intent router`.

### Task 6: Provider adapters + API route (TDD)

**Files:** Create `lib/assistant/providers.ts` (adapters: openai, gemini, claude — chat-completions shapes, fetch mocked in tests), `app/api/assistant/route.ts`, `__tests__/providers.test.ts`.

**Produces (exact):**
```ts
export type ProviderId = 'openai'|'gemini'|'claude';
export async function narrate(opts: { provider: ProviderId; apiKey: string; systemPrompt: string; userPrompt: string; signal?: AbortSignal }): Promise<string>
// route: POST /api/assistant  body {provider, messages: string[], snapshot, assumptions}
//        header x-assistant-key; 400 missing key/provider; 502 upstream error sanitized; 200 {reply}
```
System prompt template embeds PRE-COMPUTED facts JSON (from Tasks 3–4 outputs) + rule: "Sayıları yalnızca verilen bağlamdan kullan; yeni sayı üretme."

- [ ] Failing tests per adapter: correct URL/auth header/body shape; non-200 → thrown sanitized error; route handler tests (Test harness like dashboard.controller.spec style is Nest — here plain route fn tests: call exported POST(req) with mocked providers module).
- [ ] RED → GREEN → Commit: `feat(web): BYO-key LLM narration adapters + route`.

### Task 7: Assistant UI

**Files:** Extend `components/assistant/provider.tsx` (messages state, send(), settings); Create `components/assistant/{assistant-button,sheet,message-cards,projection-card,settings-dialog}.tsx`; Modify `app/dashboard/layout.tsx` (mount provider + sheet; nav center button consumes context).

- [ ] Sheet: Sheet primitive (side="bottom" mobile / side="right" desktop via two SheetContent or CSS); footer disclaimer line ("Tahminler varsayımlara dayanır…"); quick-reply chips wired to intents.
- [ ] send(): detectIntent → engine.compute (snapshot from overview+expenses summary queries via useQuery reuse) → reply blocks: ProjectionCard (Recharts LineChart portfolio + ReferenceLine fireNumber, milestones dots) / HistoryFactsCard (top matches w/ region badge) / text; if apiKey set ALSO call /api/assistant with computed facts appended as grounding, show LLM text under cards.
- [ ] Settings dialog: provider select, password input key, sliders return/inflation (defaults 30/25); localStorage `financelens-assistant-settings`.
- [ ] Crash-scenario intent: apply matched event drawdownPct to series midpoint, re-project recovery.
- [ ] Gates + manual smoke in demo mode on :3005.
- [ ] Commit: `feat(web): assistant sheet with projections, history facts and settings`.

### Task 8: Docs + final gates

**Files:** Modify `README.md` (features + screenshot slot), `AGENTS.md` (assistant module map + BYO-key conventions), `review/index.html` (roadmap item → shipped), `.env.example` untouched (no server key by design).

- [ ] Full root gates: `pnpm lint && pnpm check-types && pnpm test && pnpm build`.
- [ ] Commit: `docs: assistant feature and neon retheme documentation`.

## Self-Review

Spec coverage: §3.1→T1; §3.2→T2(+T6 provider stub); §3.3 engine→T3, history→T4, router→T5, narration/route→T6, UI/settings/crash→T7; §3.4→T8. Type consistency: ProjectionResult/HistoryEvent/Intent/narrate names consistent across tasks; route payload matches T7 usage.
