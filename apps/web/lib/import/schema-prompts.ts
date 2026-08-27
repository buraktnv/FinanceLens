/** Görselden/metinden varlık çıkarma şemaları ve promptları. */

export type ImportTarget =
  | "stock"
  | "etf"
  | "eurobond"
  | "gold"
  | "silver"
  | "cash"
  | "income";

interface TargetSchema {
  label: string;
  itemFields: string;
  example: string;
}

export const IMPORT_SCHEMAS: Record<ImportTarget, TargetSchema> = {
  stock: {
    label: "Hisse Senedi",
    itemFields:
      '"symbol" (borsa kodu, orn. THYAO, AAPL), "name", "quantity" (adet), "purchasePrice" (birim fiyat), "currency" (USD|EUR|GBP|TRY), "purchaseDate" (YYYY-MM-DD, yoksa null)',
    example:
      '{"items":[{"symbol":"THYAO","name":"Turk Hava Yollari","quantity":100,"purchasePrice":290.5,"currency":"TRY","purchaseDate":"2024-03-15"}]}',
  },
  etf: {
    label: "ETF",
    itemFields:
      '"symbol", "name", "quantity", "purchasePrice", "currency" (USD|EUR|GBP|TRY), "purchaseDate"',
    example:
      '{"items":[{"symbol":"VOO","name":"Vanguard S&P 500","quantity":10,"purchasePrice":480.2,"currency":"USD","purchaseDate":null}]}',
  },
  eurobond: {
    label: "Eurobond",
    itemFields:
      '"name" (tahvil adi/ISIN), "faceValue" (nominal), "quantity", "couponRate" (ondalik kesir, %5.25 ise 0.0525), "currency" (USD|EUR|TRY), "maturityDate" (YYYY-MM-DD, yoksa null)',
    example:
      '{"items":[{"name":"TC Devlet Tahvili 2030","faceValue":1000,"quantity":5,"couponRate":0.0525,"currency":"USD","maturityDate":"2030-05-15"}]}',
  },
  gold: {
    label: "Altın",
    itemFields:
      '"name", "grams" (gram), "pricePerGram" (alim birim fiyati), "currency" (TRY|USD)',
    example:
      '{"items":[{"name":"Cumhuriyet Altini","grams":7.216,"pricePerGram":4450,"currency":"TRY"}]}',
  },
  silver: {
    label: "Gümüş",
    itemFields:
      '"name", "grams", "pricePerGram", "currency" (TRY|USD)',
    example:
      '{"items":[{"name":"Gumus Gram","grams":50,"pricePerGram":38,"currency":"TRY"}]}',
  },
  cash: {
    label: "Nakit Hesap",
    itemFields: '"name" (hesap adi), "balance" (bakiye), "currency" (USD|EUR|GBP|TRY)',
    example: '{"items":[{"name":"Vadesiz TL","balance":25000,"currency":"TRY"}]}',
  },
  income: {
    label: "Gelir",
    itemFields:
      '"source" (gelir kaynagi), "amount" (tutar), "frequency" (SALARY|RENTAL|FREELANCE|DIVIDEND|INTEREST|OTHER), "currency" (USD|EUR|GBP|TRY), "date" (YYYY-MM-DD, yoksa null)',
    example:
      '{"items":[{"source":"Maas","amount":45000,"frequency":"SALARY","currency":"TRY","date":"2026-08-01"}]}',
  },
};

export function buildExtractionPrompt(target: ImportTarget): string {
  const schema = IMPORT_SCHEMAS[target];
  return (
    `Bu gorseldeki finansal belgeyi/ekran goruntusunu oku ve ${schema.label} kayitlarini cikar. ` +
    `Tablolar, listeler, islem gecmisleri ve ozet ekranlari kabul edilir. ` +
    `KURALLAR: Sayilari nokta/virgul ayraclarindan arindirip duz sayi uret (orn. "1.234,56 TL" -> 1234.56). ` +
    `Borsa kodu yerine sadece isim gorunuyorsa symbol/name alanina yaz, kod URETME. ` +
    `Emin olmadigin alani null yap; tahmin yurma. Belirtilmemis para birimlerini belgeden cikarabildigin kadar belirle. ` +
    `YANIT BIÇIMI: Baska hicbir metin eklemeden yalnizca su JSON'u don: ` +
    `{"items": [ { ${schema.itemFields} } ]} — bos ise {"items":[]}. Ornek: ${schema.example}`
  );
}

/** OCR metni icin: ayni semayi ham metin uzerinde uygular. */
export function buildTextExtractionPrompt(
  target: ImportTarget,
  ocrText: string,
): string {
  return (
    `Asagida OCR ile cikarilmis ham metin var. Icerisindeki ${IMPORT_SCHEMAS[target].label} ` +
    `kayitlarini tanimla.\n\n--- OCR METNI ---\n${ocrText.slice(0, 6000)}\n--- SON ---\n\n` +
    buildExtractionPrompt(target)
  );
}
