import type { HistoryEvent } from "./matcher";

/**
 * Ekonomi bilgi tabanı: RAG için küçük, öz parçalar.
 * Her parça anahtar kelime etiketleriyle eşleştirilir; embedding gerekmez.
 */
export interface KnowledgeChunk {
  id: string;
  title: string;
  tags: string[];
  text: string;
}

export const KNOWLEDGE: KnowledgeChunk[] = [
  {
    id: "k-4pct",
    title: "4% kuralı (Safe Withdrawal Rate)",
    tags: ["fire", "ozgurluk", "4", "kural", "cekilme", "emekli", "swr"],
    text:
      "4% kuralı, birikiminin yıllık %4'ünü harcarsan ana paraya dokunmadan uzun vadede sürdürebileceğini varsayar. Bu nedenle hedef birikim = yıllık gider × 25. ABD piyasaları üzerinden tarihsel olarak türetilmiştir; yüksek enflasyon ekonomilerinde daha muhafazakar (%3–3.5) oranlar önerilir.",
  },
  {
    id: "k-compound",
    title: "Bileşik getiri ve reel getiri",
    tags: ["bilesik", "getiri", "faiz", "reel", "enflasyon", "matematik"],
    text:
      "Bileşik getiride kazanç, kazanç üzerine kazanılır: uzun vadede süre, tutardan daha belirleyicidir. Reel getiri ≈ (1+nominal)/(1+enflasyon) − 1 formülüyle bulunur; %30 nominal getiri %25 enflasyonda ancak ~%4 reel koruma sağlar.",
  },
  {
    id: "k-inflation",
    title: "Enflasyonun tasarrufa etkisi",
    tags: ["enflasyon", "tasarruf", "deger kaybi", "para erimesi", "alim gucu"],
    text:
      "Yüksek enflasyon dönemlerinde bankadaki para alım gücünü kaybeder: %50 enflasyonda 100 ₺'nin alım gücü bir yılda 66 ₺'ye düşer. Tarihsel olarak hisse, altın ve döviz cinsinden varlıklar bu dönemlerde en iyi korumayı sağlamıştır.",
  },
  {
    id: "k-diversify",
    title: "Döviz çeşitlendirmesi",
    tags: ["doviz", "cesitlendirme", "kur", "usd", "eur", "risk"],
    text:
      "Tek para biriminde yoğunlaşmış birikim, kur şoklarına karşı savunmasızdır. Türkiye örneklerinde (1994, 2001, 2018) döviz dağılımı yapan haneler sermayesini korurken tek-₺ pozisyonlular büyük değer kaybetti. Yaygın pratik: gider yapacağın para biriminde nakit, geri kalanında çeşitlendirme.",
  },
  {
    id: "k-gold",
    title: "Altının uzun dönem rolü",
    tags: ["altin", "gold", "guvenli liman", "koruma"],
    text:
      "Altın üretmez ama uzun vadede enflasyonu aşan koruma sağlamıştır. 1970–2020 arasında ABD'de yıllık ~%7 nominal getirmiştir; ancak 1980 zirvesinden 25 yıl geçmeden dönmediği için 'her koşulda kazandıran' değildir. Portföyün tamamlayıcısıdır, çekirdeği değildir.",
  },
  {
    id: "k-equity-long",
    title: "Hisselerin uzun vadeli davranışı",
    tags: ["hisse", "borsa", "uzun vade", "stok", "yatirim"],
    text:
      "ABD verilerinde 20 yılı aşan herhangi bir dönemde geniş piyasa endeksleri hiç negatif reel getiri üretmemiştir; 1 yıllık dönemlerde ise sonuç tamamen şansa bağlıdır. Uzun vadeli yatırımcının en büyük avantajı zaman çizelgesidir.",
  },
  {
    id: "k-dca",
    title: "Düzenli alım (DCA) ve kriz psikolojisi",
    tags: ["duzenli alim", "dca", "kriz", "psikoloji", "panik", "dip"],
    text:
      "2008'de piyasa %57 düşmüş, panik satanlar dibi görmüş; aynı dönemde aylık düzenli alım yapanlar 2013'te yeni zirvedeydi. Davranışsal finans araştırmaları, sırayla almanın piyasa zamanlamaya göre matematiksel olarak üstün olduğunu gösterir.",
  },
  {
    id: "k-emergency",
    title: "Acil fon büyüklüğü",
    tags: ["acil fon", "yastik", "gvenlik", "nakit rezerv"],
    text:
      "Standart öneri 3–6 aylık gider kadar kolay erişilebilir nakit. Türkiye gibi istihdam şoku yüksek ekonomilerde 6–12 ay önerilir. Acil fon olmadan kriz anında uzun vadeli varlıkları dip fiyatından satmak zorunda kalınıyor.",
  },
  {
    id: "k-debt",
    title: "Borç ve kaldıraç maliyeti",
    tags: ["borc", "kredi", "faiz gideri", "kaldirac"],
    text:
      "Yüksek faiz ortamında tüketici kredisi faizleri yatırım getirisinin üzerinde seyreder: %70 kredi faizi ile %30 portföy getirisi aramak net kayıptır. Kaldıraçlı pozisyonlar krizde marj çağrısıyla kalıcı zarara dönüşür.",
  },
  {
    id: "k-realestate",
    title: "Gayrimenkul ve enflasyon",
    tags: ["gayrimenkul", "ev", "emlak", "kira"],
    text:
      "Konut, tarihsel olarak enflasyonu yakalamış ancak nakit akışı üretmeyen dönemlerde fırsat maliyeti yaratmıştır. Kira geliri üreten mülkler enflasyona endeksli emeklilik geliri alternatifi sunar; likidite riski ise sık gözden kaçar.",
  },
  {
    id: "k-allocation",
    title: "Varlık dağılımı ilkesi",
    tags: ["dailim", "portfoy", "alokasyon", "cesitlendirme"],
    text:
      "Modern portföy teorisine göre getirinin büyük kısmı varlık seçiminden değil dağılımdan gelir. Yaşa ve risk iştahına bağlı klasik başlangıç: hisse ağırlıklı büyüme ayağı + tahvil/altın dengeleyici + nakit tampon.",
  },
  {
    id: "k-rebalance",
    title: "Yeniden dengeleme (rebalancing)",
    tags: ["yeniden dengeleme", "rebalance", "disiplin"],
    text:
      "Hedef dağılımdan sapınca sat-güçlendir disiplini, 'yüksekten sat, düşükten al' davranışını otomatikleştirir. Yılda 1–2 kez uygulanması yeterlidir; aşırı sıklık işlem maliyeti yaratır.",
  },
  {
    id: "k-fire-tr",
    title: "Türkiye'de FIRE hesabı",
    tags: ["fire", "turkiye", "hedef", "hesap"],
    text:
      "TR bağlamında FIRE hesabında iki düzeltme gerekir: hedef para birimi (₺ mi $ mı) ve enflasyon farkı. Birikimi ₺ tutup harcamayı $ endekslemek yaygın bir koruma stratejisidir; hedef sayıyı yıllık gerçek enflasyonla revize etmek gerekir.",
  },
  {
    id: "k-saving-rate",
    title: "Birikim oranı belirleyiciliği",
    tags: ["birikim orani", "savings rate", "ne kadar biriktir"],
    text:
      "FIRE literatüründe emeklilik tarihinin en güçlü belirleyicisi getiri değil birikim oranıdır: %10 oranda ~40+ yıl, %50 oranda ~15–17 yıl, %70 oranda ~8–10 yıl çalışarak hedefe ulaşılır. Getiri varsayımı ikinci derecede etkilidir.",
  },
];

/** Soru-motoru uyumu için kullanılan Türkçe normalizasyon. */
export function normalizeForSearch(text: string): string {
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

function scoreChunk(chunk: KnowledgeChunk, queryTokens: string[]): number {
  let score = 0;
  for (const token of queryTokens) {
    if (token.length < 3) continue;
    for (const tag of chunk.tags) {
      const t = normalizeForSearch(tag);
      if (t === token || t.includes(token)) score += 3;
    }
    if (normalizeForSearch(chunk.title).includes(token)) score += 2;
    if (normalizeForSearch(chunk.text).includes(token)) score += 1;
  }
  return score;
}

/**
 * Basit anahtar-kelime RAG: soruyu bilgi tabanındaki parçalarla eşleştirip
 * en alakalı K parçayı döner. Skor sıfır olanlar elenir; hepsi sıfırsa
 * genel geçer ilk üç kavram döner (bağlam boş kalmasın).
 */
export function retrieveKnowledge(
  question: string,
  k = 3,
): KnowledgeChunk[] {
  const queryTokens = normalizeForSearch(question)
    .split(/[^\p{L}\p{N}%]+/u)
    .filter(Boolean);

  const scored = KNOWLEDGE.map((chunk) => ({
    chunk,
    score: scoreChunk(chunk, queryTokens),
  }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  if (scored.length > 0) return scored.map((s) => s.chunk);

  return KNOWLEDGE.filter((c) =>
    ["k-4pct", "k-saving-rate", "k-inflation"].includes(c.id),
  );
}

/** Kartlarda gösterilen olaylarla aynı kaynak: RAG'e tarih olayları da girer. */
export function eventsToContext(events: HistoryEvent[]): string {
  return events
    .map(
      (e) =>
        `${e.region} ${e.year}: ${e.title}. Düşüş %${Math.abs(e.drawdownPct)}, toparlanma: ${e.recoveryMonths ? `${e.recoveryMonths} ay` : "bir on yilda bile"} — ${e.lesson}`,
    )
    .join("\n");
}
