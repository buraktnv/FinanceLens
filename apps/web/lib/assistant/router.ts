export type Intent =
  | { kind: "greeting" }
  | { kind: "fire-date" }
  | { kind: "save-what-if"; monthlyAmount: number }
  | { kind: "expense-what-if"; reductionPct: number }
  | { kind: "crash-scenario"; eventId?: string }
  | { kind: "add-transaction"; raw: string }
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

/** "1.234" gibi TR binlik gruplarını sadeleştirir; tekil kısa grup dokunulmaz. */
function stripThousandDots(s: string): string {
  const parts = s.split(".");
  if (
    parts.length >= 2 &&
    (parts[0]?.length ?? 0) <= 3 &&
    parts.slice(1).every((p) => p.length === 3)
  ) {
    return s.replace(/\./g, "");
  }
  return s;
}

/** Extracts a monthly amount from patterns like "15k", "5 bin", "25.000 lira". */
function parseAmount(text: string): number | null {
  const kMatch = text.match(/(\d+(?:[.,]\d+)?)\s*k\b/);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]?.replace(",", ".") ?? "0") * 1000);
  }
  const binMatch = text.match(/(\d+)\s*bin/);
  if (binMatch) {
    return parseInt(binMatch[1] ?? "0", 10) * 1000;
  }
  const plain = text.match(/([\d.]{3,11})\s*(?:tl|lira|liras?)/);
  if (plain) {
    return parseInt(stripThousandDots(plain[1] ?? "0"), 10);
  }
  const bare = text.match(/\b(?:\d{1,3}(?:\.\d{3})+|\d{4,7})\b/);
  return bare ? parseInt(stripThousandDots(bare[0] ?? "0"), 10) : null;
}

/** Extracts a percentage from patterns like "%20", "%20 dusse", "yariya". */
function parsePercent(text: string): number | null {
  if (/yari(ya|sina)?|%50/.test(text)) return 50;
  const pct = text.match(/%\s*(\d{1,2})/);
  return pct ? Math.min(parseInt(pct[1] ?? "0", 10), 90) : null;
}

const CRISIS_YEARS = ["2008", "2001", "1994", "2018", "2020", "1987"];

export function detectIntent(rawText: string): Intent {
  const text = normalize(rawText);

  if (/\b(merhaba|selam|hey|naber|ne yapiyorsun|nasilsin)\b/.test(text)) {
    return { kind: "greeting" };
  }

  // Sohbetle islem ekleme: "5 adet apple aldim $105.5", "100 gram altin aldim"
  if (
    /\b(ald[iı]m|satt[iı]m|ekledim|ekle\b|bought|sold|purchased|added|invest)\b/.test(
      text,
    ) &&
    /\d/.test(text)
  ) {
    return { kind: "add-transaction", raw: rawText };
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
