import {
  Banknote,
  Coins,
  Gem,
  Landmark,
  PieChart,
  ReceiptText,
  Scale,
  TrendingUp,
  Wallet,
} from "lucide-react";

const ASSET_CLASSES = [
  {
    icon: TrendingUp,
    title: "Hisse Senetleri",
    description: "Kâr/zarar ve temettü takibi, canlı fiyatlarla.",
  },
  {
    icon: Landmark,
    title: "Eurobond",
    description: "Vade, kupon ödemeleri ve stopaj hesabı.",
  },
  {
    icon: PieChart,
    title: "ETF'ler",
    description: "Performans ve temettü dağılımları elinin altında.",
  },
  {
    icon: Coins,
    title: "Altın",
    description: "Gram ve ons bazında anlık değerleme.",
  },
  {
    icon: Gem,
    title: "Gümüş & Metaller",
    description: "Diğer değerli metallerle birlikte takip.",
  },
  {
    icon: Wallet,
    title: "Nakit & Mevduat",
    description: "Çoklu para biriminde kasa ve vade getirisi.",
  },
  {
    icon: Banknote,
    title: "Döviz Hesapları",
    description: "27 para birimi, gerçek zamanlı kurlarla.",
  },
  {
    icon: ReceiptText,
    title: "Gelir & Gider",
    description: "Kategorize harcama, ay sonu tasarruf görünümü.",
  },
  {
    icon: Scale,
    title: "Kredi & Borçlar",
    description: "Faiz oranlarıyla taksit planı ve borç yükü.",
  },
];

export function FeatureGrid() {
  return (
    <section id="varliklar" className="scroll-mt-24 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Varlık Sınıfları
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Cebindeki her şey, tek envanterde
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dağınık ekstrenler ve hesap kâğıtlarına veda et. FinanceLens dokuz
            varlık sınıfını tek bir net değer tablosunda birleştirir.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ASSET_CLASSES.map((asset) => (
            <article
              key={asset.title}
              className="group rounded-lg border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <asset.icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold">{asset.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {asset.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
