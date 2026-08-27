import type { HistoryEvent } from "./matcher";

/**
 * Türkiye: döviz kuru şokları, bankacılık krizleri ve yüksek enflasyon dönemleri.
 */
export const trEvents: HistoryEvent[] = [
  {
    id: "tr-1994",
    region: "TR",
    year: 1994,
    title: "1994 Döviz ve Borç Krizi",
    type: "crisis",
    drawdownPct: -60,
    recoveryMonths: 30,
    lesson:
      "TL varlıklarında tek gecelik %50'yi aşan değer kaybı yaşandı; döviz çeşitlendirmesi yapanlar bir yılda toparlandı.",
  },
  {
    id: "tr-2001",
    region: "TR",
    year: 2001,
    title: "2001 Bankacılık Krizi",
    type: "crisis",
    drawdownPct: -55,
    recoveryMonths: 36,
    lesson:
      "Bankalar batınca mevduat dondu; tasarruf oranı yüksek haneler krizden borçsuz çıktı. Acil fon 6-12 aylık gideri kapsamalı.",
  },
  {
    id: "tr-2018",
    region: "TR",
    year: 2018,
    title: "2018 Lira Şoku",
    type: "crisis",
    drawdownPct: -40,
    recoveryMonths: 18,
    lesson:
      "Liranın %30 değer kaybetmesiyle dolar cinsinden birikim yapanlar korundu; tek para birimi riski bir kez daha görüldü.",
  },
  {
    id: "tr-2021-inflation",
    region: "TR",
    year: 2021,
    title: "2021–23 Enflasyon Süreci",
    type: "stagflation",
    drawdownPct: -35,
    recoveryMonths: 24,
    lesson:
      "Yüksek enflasyon döneminde faiz geliri eridi; gerçek getiri negatifken hisse/altın/döviz karışımı koruma sağladı.",
  },
  {
    id: "tr-2003-boom",
    region: "TR",
    year: 2003,
    title: "2003–07 Yükseliş Dönemi",
    type: "boom",
    drawdownPct: 180,
    recoveryMonths: null,
    lesson:
      "Disiplinli fiscal dönemde TL bazlı varlıklar katlandı; ancak bu dönemler tek yönlü düşünmeye alıştırdığı için 2008'de hazırlıksız yakalayanlar çok kaybetti.",
  },
  {
    id: "tr-2016",
    region: "TR",
    year: 2016,
    title: "2016 Şok Dönemi",
    type: "crisis",
    drawdownPct: -25,
    recoveryMonths: 12,
    lesson:
      "Siyasi belirsizlik dönemlerinde kısa ama sert düşüşler yaşandı; düzenli alım stratejisi izleyenler dip bölgesinden topladı.",
  },
]
