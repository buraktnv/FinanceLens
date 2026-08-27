# FinanceLens — Neon Palette, Mobile Nav & AI Assistant — Design

- **Date:** 2026-08-25
- **Status:** Approved (user approved §1–§4 and Approach A)
- **Branch:** continues on `review-upgrade` (PR #1 open)

## 1. Goals

1. Replace the emerald brand with the user's neon palette: `#70FFD2`, `#FFFC8C`, `#FFCC4D`, `#FF9137`.
2. Restyle mobile navigation with the new identity + center assistant CTA.
3. Ship an AI assistant that answers "if I keep saving X/month, when am I financially free?" with projections, what-if scenarios, and multi-region historical analogies.

## 2. Decisions (from brainstorm Q&A)

| Question | Decision |
|---|---|
| Chatbot intelligence | Hybrid BYO-key: deterministic TS engine always; LLM narration optional via user-pasted key (client-stored, per-request header); rule-based fallback without key |
| "Economically free" | 4% rule: FIRE number = annual expenses ÷ 0.04; freedom date when portfolio ≥ FIRE number |
| Historical facts | Curated datasets, multiple regions (TR + US + global/EU/Japan), engine-matched to scenario |
| Mobile nav | Restyle with new palette + raised center assistant button opening chat sheet |
| Chat placement | Floating button → bottom sheet (mobile) / side panel (desktop), inline charts in messages |

## 3. Design

### §3.1 Palette swap (`apps/web/app/globals.css`)

Token mapping (light + dark):

| Token | Value | Notes |
|---|---|---|
| `--primary` | `#70FFD2` | mint; light mode uses dark-emerald foreground on primary fills; hover/active uses `--primary-strong` |
| `--primary-strong` | darker mint (~`#14b88a` family) | gradients, hovers, pressed states; also used as text-on-light where mint text would fail contrast |
| `--accent` | `#FF9137` | orange accent |
| `--warning` | `#FFCC4D` | gold warning fills |
| highlight/chart-extra | `#FFFC8C` | chart palette + subtle highlights only (never large surfaces — glare) |
| `--destructive` / danger | rose (unchanged) | losses must read red |
| chart palette order | mint, gold, orange, yellow, then neutrals | donut/bar charts pick up automatically |

Contrast rules carried from previous system: status colors are fill tokens (`bg-warning/15` pairs), never bare text on page backgrounds. Sweep landing page hero/CTA band, dashboard accents, badges, focus ring to the new identity. Dark mode: same hues pop more; verify primary-on-background ≥4.5:1 both modes (mint is light → in LIGHT mode buttons get dark text; mint-as-text only in DARK mode or as `primary-strong`).

### §3.2 Mobile nav restyle (`app/dashboard/layout.tsx`)

- Bottom bar becomes a floating rounded pill (inset margin, border+blur backdrop, safe-area padding).
- Active route: mint glow pill (`bg-primary/15 text-primary-strong shadow-[0_0_12px]` tone).
- Center raised circular assistant button (sparkles icon), mint→gold gradient ring, opens AssistantSheet.
- Remaining routes stay as compact items; `/status` remains reachable (strip item or trailing icon).

### §3.3 AI Assistant

**Engine** (`apps/web/lib/assistant/engine.ts`, pure functions):
- Inputs: `{ netWorthTRY, monthlySavings, monthlyExpenses }` + assumptions `{ annualReturnPct, annualInflationPct, monthlySavingOverride? , expenseReductionPct? }`.
- Outputs: `{ fireNumber, fireDate|null, yearsToFI|null, currentSavingsRate, series: [{date, portfolio, fireNumber}], milestones[] }`.
- Math: month-step compounding at real return; FIRE number from expenses (after reduction if applied). Edge cases: already-FI (portfolio ≥ fireNumber → immediate), negative net worth (debt payoff phase shown), zero expenses (fireNumber 0).
- Assumption defaults for TRY context: return 30%, inflation 25% (≈5% real) — user-adjustable sliders.

**History matcher** (`lib/assistant/history/{tr,us,global}.ts` + `matcher.ts`):
- ~20 curated events total across TR (1994, 2001, 2018 lira shock, 2021–23 inflation), US (1970s stagflation, dot-com, 2008, COVID), global (eurozone crisis, Japan lost decades): `{ id, region, year, title, type: crisis|boom|stagflation, drawdownPct, recoveryMonths, lesson }`.
- Matcher scores user scenario (horizon length, real-return regime, currency volatility proxy) against event signatures → top N with count phrasing ("Benzer koşullar son 40 yılda 5 kez yaşandı").

**Intent router** (`lib/assistant/router.ts`): greeting · fire-date · save-X-what-if (parses amounts, incl. slider-driven recompute) · expense-reduction what-if · crash-scenario ("2008 olsaydı") applying historical drawdown to series · help/fallback.

**Conversation UI** (`components/assistant/*`):
- `AssistantProvider` (open state, messages) mounted in dashboard layout; floating `AssistantButton`; `AssistantSheet` = Sheet (mobile bottom / desktop right panel).
- Messages: user bubbles; assistant replies render rich blocks: `ProjectionCard` (Recharts line of portfolio vs FIRE-number horizontal line, milestone markers), `HistoryFactsCard` (event list), plain text.
- Quick-reply chips: "Ne zaman özgür olurum?", "Ayda 15k biriktirirsem?", "Giderlerim %20 düşse?", "2008 krizi olsaydı?"
- `AssistantSettingsDialog`: provider (OpenAI/Gemini/Claude) + API key + assumption sliders; persisted localStorage only.

**LLM narration path**: `apps/web/app/api/assistant/route.ts` — POST `{messages, snapshot, provider}` with `x-assistant-key` header; server calls chosen provider's chat completions with a grounded system prompt embedding engine-computed facts (numbers NEVER invented by LLM — it narrates/reformats only); returns JSON `{reply}`; no key storage, no logging. Provider adapters isolated in `lib/assistant/providers.ts`.

**Demo mode**: works fully offline (engine + mocks); LLM toggle simply unavailable without key.

### §3.4 Docs

README features section, AGENTS.md conventions (assistant module map, BYO-key note), review/index.html roadmap item moved to shipped.

## 4. Testing

- Vitest unit: engine math (compounding, FIRE edge cases, override/reduction), history matcher scoring/ordering, intent router table-driven cases, provider request shaping (fetch mocked).
- Existing suites stay green; demo-mode contract test for assistant using mock overview data.

## 5. Verification

Gates green (`pnpm lint && pnpm check-types && pnpm test && pnpm build`); manual smoke on dev server: nav glow + assistant sheet flows, projection card renders from mock data, settings dialog round-trip, LLM path skipped gracefully without key.

## 6. Risks

- Mint-on-white contrast in light mode → mitigated via `primary-strong` for text/hover + dark foregrounds on fills (verified during implementation).
- LLM providers' API shape drift → thin adapters, single integration point, non-LLM path unaffected.
- Financial-advice sensitivity → assistant always frames outputs as projections from stated assumptions + historical analogy, includes disclaimer line in sheet footer.
