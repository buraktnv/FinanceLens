/** LLM/OCR ciktiini guvenli satirlara donusturen parser + flag mantigi. */

export interface ExtractedRow {
  selected: boolean;
  flags: string[];
  values: Record<string, string | number | null>;
}

const NUMERIC_FIELDS = new Set([
  "quantity",
  "purchasePrice",
  "pricePerGram",
  "grams",
  "faceValue",
  "balance",
  "amount",
  "couponRate",
]);

/** "1.234,56" | "1,234.56" | "15K" | "1 234" -> number; basarisizsa null. */
export function parseFlexibleNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;

  let s = raw.trim().replace(/\s/g, "");
  if (!s) return null;

  const kMatch = s.match(/^(\d+(?:[.,]\d+)?)\s*[kK]$/);
  if (kMatch) return Math.round(parseFloat((kMatch[1] ?? "0").replace(",", ".")) * 1000);

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // Son ayrac ondalik ayracidir.
    s =
      s.lastIndexOf(",") > s.lastIndexOf(".")
        ? s.replace(/\./g, "").replace(",", ".")
        : s.replace(/,/g, "");
  } else if (hasComma) {
    // Tek virgul: 2 haneliyse ondalik, degilse binlik kabul et.
    const parts = s.split(",");
    s =
      parts.length === 2 && (parts[1]?.length ?? 0) !== 3
        ? s.replace(",", ".")
        : s.replace(/,/g, "");
  } else if (hasDot) {
    // TR binlik ayirici kaliabi: bastaki grup 1-3 hane, sonrasindaki her grup
    // tam 3 hane ("1.234", "123.456", "1.234.567"). Ilk grup 4+ haneyse
    // nokta ondalik ayiracidir ("3845.125" altin grami gibi).
    const parts = s.split(".");
    const isGrouped =
      parts.length >= 2 &&
      (parts[0]?.length ?? 0) <= 3 &&
      parts.slice(1).every((p) => p.length === 3);
    if (isGrouped) s = s.replace(/\./g, "");
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function flagRow(values: Record<string, unknown>): string[] {
  const flags: string[] = [];

  const identifier = values.symbol ?? values.name ?? values.source;
  if (!identifier || String(identifier).trim() === "") {
    flags.push("Sembol/isim eksik");
  }

  for (const field of NUMERIC_FIELDS) {
    if (field in values) {
      const n = values[field];
      if (n === null || n === undefined) {
        flags.push(`${field} bos`);
      } else if (typeof n === "number" && n <= 0) {
        flags.push(`${field} sifir veya negatif`);
      } else if (
        typeof n === "number" &&
        field !== "couponRate" &&
        !Number.isSafeInteger(Math.round(n * 10000))
      ) {
        flags.push(`${field} beklenmedik buyuklukte`);
      }
    }
  }

  if ("currency" in values && typeof values.currency === "string") {
    if (!["USD", "EUR", "GBP", "TRY"].includes(values.currency.toUpperCase())) {
      flags.push("Bilinmeyen para birimi");
    }
  }

  return flags;
}

/**
 * Model ciktisini (JSON beklenir, kod fence/prose toleransli) satirlara
 * cevirir. Sayilar parseFlexibleNumber ile normalize edilir, supheli
 * satirlar flag'lenir. Hicbir sekilde exception firlatmaz.
 */
export function parseExtractionResponse(
  raw: string,
): { rows: ExtractedRow[]; error?: string } {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end <= start) {
      return { rows: [], error: "Model JSON donmedi" };
    }
    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      items?: Array<Record<string, unknown>>;
    };
    const items = Array.isArray(parsed.items) ? parsed.items.slice(0, 50) : [];

    const rows: ExtractedRow[] = items.map((item) => {
      const values: Record<string, string | number | null> = {};
      for (const [key, value] of Object.entries(item)) {
        if (NUMERIC_FIELDS.has(key)) {
          values[key] = parseFlexibleNumber(value);
        } else if (value === null || value === undefined) {
          values[key] = null;
        } else {
          values[key] = sanitizeText(String(value));
        }
      }
      return { selected: true, flags: flagRow(values), values };
    });

    if (rows.length === 0) return { rows: [], error: "Belgede kayit bulunamadi" };
    return { rows };
  } catch {
    return { rows: [], error: "Model ciktisi cozumlenemedi" };
  }
}

/** Emoji/dash/beyaz uzay temizligi (LLM suslemelerine karsi). */
function sanitizeText(s: string): string {
  return s
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu, "")
    .replace(/\uFE0F/g, "")
    .replace(/\u200D/g, "")
    .replace(/\s*[\u2014\u2013]\s*/g, ", ")
    .replace(/ {2,}/g, " ")
    .trim();
}
