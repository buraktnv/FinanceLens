export type Intent =
  | { kind: "greeting" }
  | { kind: "fire-date" }
  | { kind: "save-what-if"; monthlyAmount: number }
  | { kind: "expense-what-if"; reductionPct: number }
  | { kind: "crash-scenario"; eventId?: string }
  | { kind: "help" };

/** Turkish ASCII-tolerant normalization: fold diacritics via code-point escapes. */
function normalize(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/\u0131/g, "i") // dotless ı
    .replace(/\u011f/g, "g") // ğ
    .replace(/\u00fc/g, "u") // ü
    .replace(/\u015f/g, "s") // ş
    .replace(/\u00f6/g, "o") // ö
    .replace(/\u00e7/g, "c") // ç
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Extracts a monthly amount from patterns like "15k", "5 bin", "25000". */
function parseAmount(text: string): number | null {
  const kMatch = text.match(/(\d+(?:[.,]\d+)?)\s*k\b/);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1].replace(",", ".")) * 1000);
  }
  const binMatch = text.match(/(\d+)\s*bin/);
  if (binMatch) {
    return parseInt(binMatch[1], 10) * 1000;
  }
  const plain = text.match(/(\d{3,7})\s*(?:tl|lira|liras?)/);
  if (plain) {
    return parseInt(plain[1], 10);
  }
  const bare = text.match(/\b(\d{4,7})\b/);
  return bare ? parseInt(bare[1], 10) : null;
}

/** Extracts a percentage from patterns like "%20", "%20 dusse", "yariya". */
function parsePercent(text: string): number | null {
  if (/yari(ya|sina)?|%50/.test(text)) return 50;
  const pct = text.match(/%\s*(\d{1,2})/);
  return pct ? Math.min(parseInt(pct[1], 10), 90) : null;
}

const CRISIS_YEARS = ["2008", "2001", "1994", "2018", "2020", "1987"];

export function detectIntent(rawText: string): Intent {
  const text = normalize(rawText);

  if (/\b(merhaba|selam|hey|naber|ne yapıyorsun|nasilsin)\b/.test(text)) {
    return { kind: "greeting" };
  }

  if (/(kriz|cokerse|cokse|batarsa|rezil|dusus)/.test(text)) {
    const year = CRISIS_YEARS.find((y) => text.includes(y));
    return { kind: "crash-scenario", eventId: year };
  }

  const amount = parseAmount(text);
  if (
    amount !== null &&
    /(biriktir|biriktirsem|ayda|tasarruf|koyarsam|koysam|yatirirsam)/.test(text)
  ) {
    return { kind: "save-what-if", monthlyAmount: amount };
  }

  const pct = parsePercent(text);
  if (pct !== null && /(gider|harcama|masraf)/.test(text)) {
    return { kind: "expense-what-if", reductionPct: pct };
  }

  // "bağımsızlığa" softens lık→lığ before suffixes, hence bagimsizli.
  if (/(ozgur|bagimsizli|fire|emekli|yeterl?i?)/.test(text)) {
    return { kind: "fire-date" };
  }

  if (/\b(yardim|nasil|komut|ne yapabilirsin|nedir)\b/.test(text)) {
    return { kind: "help" };
  }

  return { kind: "help" };
}
