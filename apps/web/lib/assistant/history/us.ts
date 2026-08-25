import type { HistoryEvent } from "./matcher";

/**
 * ABD: döngüsel piyasa krizleri ve toparlanmalar.
 */
export const usEvents: HistoryEvent[] = [
  {
    id: "us-1970s",
    region: "US",
    year: 1973,
    title: "1970'ler Stagflasyonu",
    type: "stagflation",
    drawdownPct: -48,
    recoveryMonths: 90,
    lesson:
      "Hem enflasyon hem işsizlik aynı anda arttı; hisse senetleri 10 yıl nominal olarak bile yatay seyretti. reel varlıklar (emtia, gayrimenkul) öne çıktı.",
  },
  {
    id: "us-2000-dotcom",
    region: "US",
    year: 2000,
    title: "Dot-Com Balonu Patlaması",
    type: "crisis",
    drawdownPct: -49,
    recoveryMonths: 84,
    lesson:
      "Değerlemesiz büyüyen teknoloji hisseleri %80'e varan kayıplar verdi; düzenli ve çeşitlendirilmiş portföy sahipleri zarardan korundu.",
  },
  {
    id: "us-2008-gfc",
    region: "US",
    year: 2008,
    title: "2008 Küresel Finans Krizi",
    type: "crisis",
    drawdownPct: -57,
    recoveryMonths: 60,
    lesson:
      "Panik satışı yapanlar dip noktasında kaldı; aylık düzenli alım yapan yatırımcı 2013'te yeni zirvedeydi. Krizde satmamak tarihsel olarak hep kazandırdı.",
  },
  {
    id: "us-2020-covid",
    region: "US",
    year: 2020,
    title: "COVID Çöküşü ve Hızlı Toparlanma",
    type: "crisis",
    drawdownPct: -34,
    recoveryMonths: 6,
    lesson:
      "%34'lük çöküş sadece 6 ayda geri alındı; piyasayı bekletenler en büyük yükselişi kaçırdı. Zamanlama değil, süreklilik belirleyici oldu.",
  },
  {
    id: "us-1990s-boom",
    region: "US",
    year: 1991,
    title: "1990'lar Uzun Genişleme",
    type: "boom",
    drawdownPct: 200,
    recoveryMonths: null,
    lesson:
      "On yıla yakın kesintisiz yükselişte düzenli alım yapan bireysel yatırımcılar en çok kazananlar oldu; piyasa zamanlaması yapanlar geride kaldı.",
  },
  {
    id: "us-2011",
    region: "US",
    year: 2011,
    title: "2011 Kredi Notu Düşüşü",
    type: "crisis",
    drawdownPct: -19,
    recoveryMonths: 10,
    lesson:
      "Manşetler korkutucuydu ama düşüş kısaydı; haber akışına göre işlem yapanlar en çok zarar eden grup oldu.",
  },
]
