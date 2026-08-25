import { projectFire, type Assumptions, type AssistantSnapshot, type ProjectionResult } from "./engine";
import { matchHistory } from "./history/matcher";
import type { HistoryEvent } from "./history/matcher";
import type { Intent } from "./router";
import {
  parseTransactionLocally,
  type PendingTxn,
} from "./transaction-parse";

export interface TextBlock {
  type: "text";
  text: string;
  /** Optional short bullet points rendered under the text. */
  points?: string[];
}
export interface ProjectionBlock {
  type: "projection";
  result: ProjectionResult;
  compare?: ProjectionResult;
  compareLabel?: string;
}
export interface HistoryBlock {
  type: "history";
  events: HistoryEvent[];
  intro: string;
}
export interface ConfirmBlock {
  type: "confirm";
  txn: PendingTxn;
}
export type ReplyBlock = TextBlock | ProjectionBlock | HistoryBlock | ConfirmBlock;

export function buildReply(
  intent: Intent,
  snapshot: AssistantSnapshot,
  assumptions: Assumptions,
  allEvents: HistoryEvent[],
): ReplyBlock[] {
  switch (intent.kind) {
    case "greeting":
      return [
        {
          type: "text",
          text:
            "Merhaba! Ben Finans asistanın. Bana durumunu söyleyin, geleceğinizi projeksiyon edeyim. Örneğin:\n• \"Ne zaman özgür olurum?\"\n• \"Ayda 15k biriktirirsem?\"\n• \"Giderlerim %20 düşse?\"\n• \"2008 gibi bir kriz olsaydı?\"",
        },
      ];

    case "fire-date":
    case "save-what-if":
    case "expense-what-if": {
      const effective: Assumptions =
        intent.kind === "save-what-if"
          ? { ...assumptions, monthlySavingOverride: intent.monthlyAmount }
          : intent.kind === "expense-what-if"
            ? { ...assumptions, expenseReductionPct: assumptions.expenseReductionPct ?? intent.reductionPct }
            : assumptions;

      const result = projectFire(snapshot, effective);
      const blocks: ReplyBlock[] = [];

      if (intent.kind === "save-what-if") {
        blocks.push({
          type: "text",
          text: `Ayda ${intent.monthlyAmount.toLocaleString("tr-TR")} ₺ biriktirdiğini varsayarak hesapladım:`,
        });
      } else if (intent.kind === "expense-what-if") {
        blocks.push({
          type: "text",
          text: `Giderlerini %${intent.reductionPct} azalttığını varsaydım:`,
        });
      }

      if (result.alreadyFI) {
        blocks.push({
          type: "text",
          text: `Tebrikler — 4% kuralına göre finansal özgürlük eşiğindesin! Hedef birikim (yıllık giderin × 25): ${Math.round(result.fireNumberTRY).toLocaleString("tr-TR")} ₺`,
        });
        return blocks;
      }

      if (result.fireDateISO) {
        const dateStr = new Date(result.fireDateISO).toLocaleDateString("tr-TR", {
          month: "long",
          year: "numeric",
        });
        blocks.push({
          type: "text",
          text: `Bu tempoyla yaklaşık ${String(result.yearsToFI).replace(".", ",")} yıl sonra, ${dateStr} tarihinde finansal özgürlük eşiğini geçiyorsun.`,
        });
      } else {
        blocks.push({
          type: "text",
          text: "Mevcut varsayımlarla 50 yıl içinde eşik geçilmiyor. Birikimi artırmayı veya giderleri azaltmayı deneyelim mi?",
        });
      }

      blocks.push({ type: "projection", result });

      if (intent.kind !== "fire-date") {
        const baseResult = projectFire(snapshot, assumptions);
        if (baseResult.fireDateISO !== result.fireDateISO) {
          blocks.push({
            type: "projection",
            result: baseResult,
            compare: result,
            compareLabel: intent.kind === "save-what-if" ? "Senaryo" : "Azaltılmış gider",
          });
        }
      }
      return blocks;
    }

    case "crash-scenario": {
      const result = projectFire(snapshot, assumptions);
      const matches = matchHistory(allEvents, {
        horizonYears: result.yearsToFI ?? 10,
        realReturnPct: assumptions.annualReturnPct - assumptions.annualInflationPct > 0 ? -20 : -30,
        currencyVolatility: "high",
      }, 3);
      return [
        {
          type: "text",
          text: "Kriz senaryosunda portföyünü tarihsel çöküş derinlikleriyle test ettim:",
        },
        { type: "projection", result },
        {
          type: "history",
          intro: "Benzer koşullar tarihte şu şekilde yaşandı:",
          events: matches.map((m) => m.event),
        },
      ];
    }

    case "add-transaction": {
      const txn = parseTransactionLocally(intent.raw);
      if (!txn) {
        return [
          {
            type: "text",
            text: "İşlemi anlayamadım. Örnek biçim: \"5 adet Apple aldım $105.5\" ya da \"100 gram altın aldım 4450 ₺\".",
          },
        ];
      }
      const kindLabel: Record<PendingTxn["kind"], string> = {
        stock: "Hisse senedi",
        etf: "ETF",
        gold: "Altın",
        silver: "Gümüş",
        eurobond: "Eurobond",
        cash: "Nakit",
        income: "Gelir",
      };
      return [
        {
          type: "text",
          text: `Şu ${kindLabel[txn.kind].toLowerCase()} kaydını anladım; onaylarsan ekliyorum.`,
        },
        { type: "confirm", txn },
      ];
    }

    case "help":
    default:
      return [
        {
          type: "text",
          text: "Şunları sorabilirsin:\n• \"Ne zaman özgür olurum?\" — 4% kuralıyla hedef tarihin\n• \"Ayda 10k biriktirirsem?\" — birikim senaryoları\n• \"Giderlerim %30 düşse?\" — gider optimizasyonu\n• \"2008 gibi bir kriz olsaydı?\" — tarihsel stres testi\n\nAyarlar'dan getiri/enflasyon varsayımlarını değiştirebilirsin.",
        },
      ];
  }
}

/** Builds the grounded narration prompt: engine facts + RAG knowledge. */
export function buildNarrationUserPrompt(
  question: string,
  blocks: ReplyBlock[],
  ragContext?: string[],
): string {
  const facts = blocks
    .map((b) => {
      if (b.type === "text") return b.text;
      if (b.type === "projection")
        return `[PROJEKSİYON] Hedef: ${Math.round(b.result.fireNumberTRY)} ₺, tahmini tarih: ${b.result.fireDateISO ?? "50y içinde değil"}, yıl: ${b.result.yearsToFI ?? "-"}`;
      if (b.type === "history")
        return `[TARİH] ${b.events.map((e) => `${e.year} ${e.title}`).join("; ")}`;
      return "";
    })
    .join("\n");

  const ragSection =
    ragContext && ragContext.length > 0
      ? `\n\nEkonomi bilgi tabanından alınan bağlam (yalnızca bunları açıklayıcı olarak kullan):\n${ragContext
          .map((c) => `[BİLGİ] ${c}`)
          .join("\n")}`
      : "";

  return `Kullanıcının sorusu: "${question}"\n\nMotor tarafından hesaplanan doğruluk bilgileri:\n${facts}${ragSection}\n\nBu bilgileri temel alarak yalnızca istenen JSON formatında yanıt ver.`;
}

/**
 * Strips emojis/pictographs and replaces em/en dashes so the model can never
 * decorate answers in ways the design system does not allow.
 */
export function sanitizeLlmText(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu, "")
    .replace(/\uFE0F/g, "")
    .replace(/\u200D/g, "")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/ {2,}/g, " ")
    .trim();
}

interface LlmNarration {
  summary: string;
  points: string[];
}

/**
 * Parses the model's JSON narration contract:
 * {"summary": "...", "points": ["..."]}.
 * Tolerates code fences and surrounding prose; falls back to treating the
 * whole raw text as the summary.
 */
export function parseLlmNarration(raw: string): LlmNarration {
  const sanitized = sanitizeLlmText(raw);

  const start = sanitized.indexOf("{");
  const end = sanitized.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(sanitized.slice(start, end + 1)) as {
        summary?: unknown;
        points?: unknown;
      };
      if (typeof parsed.summary === "string" && parsed.summary.trim()) {
        return {
          summary: sanitizeLlmText(parsed.summary),
          points: Array.isArray(parsed.points)
            ? parsed.points
                .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
                .slice(0, 4)
                .map((p) => sanitizeLlmText(p))
            : [],
        };
      }
    } catch {
      // fall through to plain-text handling
    }
  }

  return { summary: sanitized, points: [] };
}
