import type { HistoryEvent } from "./matcher";

/**
 * Küresel: Avrupa/Japonya kökenli uzun dönemli olaylar.
 */
export const globalEvents: HistoryEvent[] = [
  {
    id: "global-1987",
    region: "GLOBAL",
    year: 1987,
    title: "Black Monday (1987)",
    type: "crisis",
    drawdownPct: -23,
    recoveryMonths: 24,
    lesson:
      "Tek günde %22 düşüş yaşandı ama yapısal bir sebep yoktu; sabreden portföyler iki yılda toparlandı.",
  },
  {
    id: "global-1992-erm",
    region: "GLOBAL",
    year: 1992,
    title: "1992 ERM Krizi",
    type: "crisis",
    drawdownPct: -15,
    recoveryMonths: 12,
    lesson:
      "Sabit kur rejimleri kırılgandır; para birimi riski taşıyan herkesin kur çeşitlendirmesi yapması gerektiğini gösterdi.",
  },
  {
    id: "global-2010-eurozone",
    region: "GLOBAL",
    year: 2010,
    title: "Avrupa Borç Krizi",
    type: "crisis",
    drawdownPct: -21,
    recoveryMonths: 48,
    lesson:
      "Bölgesel yoğunlaşma riski somutlaştı; Avrupa ağırlıklı portföyler küresel çeşitlendirme yapanlara göre çok daha yavaş toplandı.",
  },
  {
    id: "global-japan-decades",
    region: "GLOBAL",
    year: 1990,
    title: "Japonya Kayıp On Yılları",
    type: "stagflation",
    drawdownPct: -80,
    recoveryMonths: null,
    lesson:
      "Zirveden %80 düşen Japon piyasası 34 yıl boyunca eski zirvesini görmedi; tek ülke/tek varlık konsantrasyonu kalıcı sermaye kaybına yol açabilir.",
  },
  {
    id: "global-2009-boom",
    region: "GLOBAL",
    year: 2009,
    title: "2009–21 Küresel Boğa Piyasası",
    type: "boom",
    drawdownPct: 200,
    recoveryMonths: null,
    lesson:
      "Kriz dibinde düzenli yatırım yapanlar on iki yıllık boğa piyasasında tarihin en iyi getirisini gördü; korkunun en pahalı olduğu an dibi oldu.",
  },
  {
    id: "global-2022",
    region: "GLOBAL",
    year: 2022,
    title: "2022 Küresel Sıkılaşma",
    type: "stagflation",
    drawdownPct: -25,
    recoveryMonths: null,
    lesson:
      "Hem hisse hem tahvil aynı anda düştü; klasik 60/40 portföy koruma sağlayamadı. Enflasyona dayanıklı varlıklar fark yarattı.",
  },
]
