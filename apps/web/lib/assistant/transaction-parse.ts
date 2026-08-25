/**
 * Sohbetten islem cikarma: yerel kural-parser (anahtarsiz yol) ve LLM JSON
 * sozlesmesi (anahtarli yol) ayni PendingTxn sekline indirgenir.
 */

export type TxnKind = "stock" | "etf" | "gold" | "silver" | "eurobond" | "cash" | "income";

export interface PendingTxn {
  kind: TxnKind;
  name: string;
  /** Hisse/ETF borsa kodu; biliniyorsa dolu, degilse null (kullanici tamamlar). */
  symbol: string | null;
  quantity: number | null;
  price: number | null;
  currency: "USD" | "EUR" | "GBP" | "TRY";
}

/** router'daki normalizasyonun birebir kopyasi (bagimlilik yok). */
function normalize(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/\u0131/g, "i")
    .replace(/\u011f/g, "g")
    .replace(/\u00fc/g, "u")
    .replace(/\u015f/g, "s")
    .replace(/\u00f6/g, "o")
    .replace(/\u00e7/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectKind(text: string): TxnKind {
  if (/altin|gold|ons/.test(text)) return "gold";
  if (/gumus|silver/.test(text)) return "silver";
  if (/eurobond|tahvil|bond/.test(text)) return "eurobond";
  if (/\betf\b|fond/.test(text)) return "etf";
  if (/nakit|hesap actim|para yatirdim|deposit/.test(text)) return "cash";
  if (/gelir|maas|kira geliri|dividend|temettu|salary/.test(text)) return "income";
  return "stock";
}

function detectCurrency(text: string): PendingTxn["currency"] {
  if (/\u20ba/.test(text)) return "TRY"; // ₺
  if (/\u20ac/.test(text)) return "EUR"; // €
  if (/\$|\busd\b/.test(text)) return "USD";
  if (/\bgbp\b|sterlin/.test(text)) return "GBP";
  if (/\beur\b|\bavro\b/.test(text)) return "EUR";
  return "TRY";
}

function parseNum(s: string): number {
  const cleaned = s.replace(/\s/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    return parseFloat(
      cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, ""),
    );
  }
  // TR baglami: tek nokta + 3 hane sonunda -> binlik; aksi halde ondalik.
  if (cleaned.includes(".") && /\.\d{3}$/.test(cleaned) && !cleaned.includes(",")) {
    const [intPart, frac] = cleaned.split(".");
    if ((intPart?.length ?? 0) <= 3 && (frac?.length ?? 0) === 3 && /^\d+$/.test(intPart ?? "")) {
      // "105.500" belirsiz; fiyatlarda ondalik olasiligi agirlikli ama
      // 3 haneli son ek + kisa bas grup binliktir. Karar: binlik.
      return parseFloat(cleaned.replace(".", ""));
    }
    return parseFloat(cleaned);
  }
  return parseFloat(cleaned.replace(",", "."));
}

/**
 * Anahtarsiz yol: cumleden ne anliyorsan cikarir. Sembol URETMEZ —
 * name alanini doldurur, symbol null kalir ki kullanici onay kartinda
 * tamamlayabilsin (MyATMM dersleri: yanlis ticker atamak catilir).
 */
export function parseTransactionLocally(rawText: string): PendingTxn | null {
  const text = normalize(rawText);

  const quantity =
    text.match(
      /(\d+(?:[.,]\d+)?)\s*(?:adet|his|shares?|grams?|gr\b|lot)/,
    )?.[1] ??
    rawText.match(/(?:aldim|bought|purchased|alinan)\D{0,12}?(\d+(?:[.,]\d+)?)/i)?.[1] ??
    text.match(/\b(\d{1,6}(?:[.,]\d+)?)\b/)?.[1];

  const priceMatch =
    rawText.match(/[$€₺]\s*(\d+(?:[.,]\d+)?(?:\.\d{3})?)/) ??
    rawText.match(/(\d+(?:[.,]\d+)?(?:\.\d{3})?)\s*[$€₺]/) ??
    rawText.match(/(?:@|at|uzerinden|fiyat[i]?)\s*\$?(\d+(?:[.,]\d+)?)/i);

  if (!quantity && !priceMatch) return null;

  const kind = detectKind(text);
  const currency = detectCurrency(rawText);

  // Varlik adi: miktar/fiyat/anahtar kelime disindaki en uzun kelime dizisi.
  const stop = new Set([
    "aldim","alindi","sattim","satildi","ekle","ekledim","adet","his","gram","gr","tane",
    "bought","sold","added","purchased","at","the","of","adetini","tanim","kadar",
    "usd","eur","gbp","try","fiyat","uzerinden","icin",
  ]);
  const words = normalize(rawText)
    .split(/[^\p{L}\p{N}%.$€₺]+/u)
    .filter((w) => w.length > 1 && !stop.has(w) && !/^\d/.test(w));
  const name =
    rawText
      .split(/[.,;!?\n]|(?:aldim|sattim|bought|purchased|ekledim)/i)[0]
      ?.trim() || words.join(" ");

  const price = priceMatch ? parseNum(priceMatch[1] ?? "") : null;

  return {
    kind,
    name: name.trim().slice(0, 60) || "Bilinmeyen varlik",
    symbol: /^[A-Z]{2,6}$/.test(rawText.trim()) ? rawText.trim().toUpperCase() : null,
    quantity: quantity ? parseNum(quantity) : null,
    price: price !== null && Number.isFinite(price) ? price : null,
    currency,
  };
}

/**
 * Anahtarli yol: LLM'in dondurdugu JSON'u PendingTxn'e cevirir.
 * Beklenen sekil: {"kind":"stock","name":"...","symbol":"AAPL","quantity":5,"price":105.5,"currency":"USD"}
 */
export function parseTransactionFromLlm(raw: string): PendingTxn | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    const kinds: TxnKind[] = ["stock", "gold", "silver", "eurobond", "cash", "income"];
    const kind = kinds.includes(parsed.kind as TxnKind)
      ? (parsed.kind as TxnKind)
      : "stock";
    const num = (v: unknown): number | null => {
      const n = typeof v === "string" ? parseNum(v) : Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const currencyRaw = String(parsed.currency ?? "TRY").toUpperCase();
    const currency = (["USD", "EUR", "GBP", "TRY"].includes(currencyRaw)
      ? currencyRaw
      : "TRY") as PendingTxn["currency"];

    return {
      kind,
      name: String(parsed.name ?? parsed.source ?? "Bilinmeyen varlik").slice(0, 60),
      symbol:
        typeof parsed.symbol === "string" && parsed.symbol.trim()
          ? parsed.symbol.trim().toUpperCase()
          : null,
      quantity: num(parsed.quantity),
      price: num(parsed.price ?? parsed.amount ?? null),
      currency,
    };
  } catch {
    return null;
  }
}
