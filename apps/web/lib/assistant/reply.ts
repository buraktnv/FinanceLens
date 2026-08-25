import { projectFire, type Assumptions, type AssistantSnapshot, type ProjectionResult } from "./engine";
import { matchHistory } from "./history/matcher";
import type { HistoryEvent } from "./history/matcher";
import type { Intent } from "./router";

export interface TextBlock {
  type: "text";
  text: string;
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
export type ReplyBlock = TextBlock | ProjectionBlock | HistoryBlock;

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

/** Builds the grounded narration prompt for optional LLM polish. */
export function buildNarrationUserPrompt(
  question: string,
  blocks: ReplyBlock[],
): string {
  const facts = blocks
    .map((b) => {
      if (b.type === "text") return b.text;
      if (b.type === "projection")
        return `[PROJEKSİYON] Hedef: ${Math.round(b.result.fireNumberTRY)} ₺, tahmini tarih: ${b.result.fireDateISO ?? "50y içinde değil"}, yıl: ${b.result.yearsToFI ?? "-"}`;
      return `[TARİH] ${b.events.map((e) => `${e.year} ${e.title}`).join("; ")}`;
    })
    .join("\n");
  return `Kullanıcının sorusu: "${question}"\n\nMotor tarafından hesaplanan doğruluk bilgileri:\n${facts}\n\nBu bilgileri temel alarak samimi, kısa ve motive edici bir Türkçe yanıt yaz.`;
}
