import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoButton } from "@/components/landing/demo-button";

interface HeroProps {
  onDemo: () => void;
  demoLoading: boolean;
}

const SPARK_POINTS = "0,46 20,42 40,43 60,36 80,39 100,30 120,33 140,24 160,27 180,17 200,20 220,10 240,12";

export function Hero({ onDemo, demoLoading }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="container mx-auto grid items-center gap-14 px-4 py-16 md:py-24 lg:grid-cols-2 lg:gap-10">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Kişisel finans kokpitin
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
            Tüm varlıkların{" "}
            <span className="text-primary">tek ekranda</span>, net değerin anında
            hesapta.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground lg:mx-0">
            {
              "Hisseler, eurobondlar, ETF'ler, altın, döviz ve nakit… FinanceLens hepsini toplayıp net değerini gerçek zamanlı kurlarla gösterir. Harcamalarını takip et, birikimin kaç ay yeter görmeye başla."
            }
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/register">
                Ücretsiz Başla
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <DemoButton
              onDemo={onDemo}
              loading={demoLoading}
              className="w-full sm:w-auto"
            />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Kredi kartı gerekmez · Kurulum gerektirmez
          </p>
        </div>
        <ProductMock />
      </div>
    </section>
  );
}

function ProductMock() {
  return (
    <div className="relative mx-auto w-full max-w-md pb-8 md:pb-10">
      {/* Net worth card */}
      <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            Toplam Net Değer
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
            <TrendingUp className="size-3" aria-hidden="true" />
            +%12,4
          </span>
        </div>
        <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
          ₺1.248.530
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <RateChip label="USD" value="41,32 ₺" />
          <RateChip label="EUR" value="44,85 ₺" />
          <RateChip label="Altın (gr)" value="4.212 ₺" />
          <span className="ml-auto inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-1.5 animate-pulse rounded-full bg-primary"
            />
            canlı
          </span>
        </div>
        <svg
          viewBox="0 0 240 56"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="mt-3 h-14 w-full text-primary"
        >
          <defs>
            <linearGradient id="heroSparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`${SPARK_POINTS} 240,56 0,56`}
            fill="url(#heroSparkFill)"
          />
          <polyline
            points={SPARK_POINTS}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Monthly savings mini card */}
      <div className="relative z-10 mt-4 rounded-xl border bg-card p-4 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg md:absolute md:-right-8 md:-top-8 md:mt-0 md:max-w-[11rem]">
        <p className="text-xs text-muted-foreground">Bu ay tasarruf</p>
        <p className="mt-0.5 text-xl font-semibold tabular-nums">₺18.400</p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
          <TrendingUp className="size-3" aria-hidden="true" />%8 artış
        </p>
      </div>

      {/* Allocation donut card */}
      <div className="relative z-10 rounded-xl border bg-card p-4 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg md:absolute md:-bottom-12 md:-left-8 md:w-56">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <svg
              viewBox="0 0 42 42"
              aria-hidden="true"
              className="size-20 -rotate-90"
            >
              <circle
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                strokeWidth="5"
                stroke="currentColor"
                className="text-muted"
                pathLength={100}
              />
              <circle
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                strokeWidth="5"
                stroke="currentColor"
                strokeLinecap="round"
                className="text-primary"
                pathLength={100}
                strokeDasharray="58 42"
              />
              <circle
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                strokeWidth="5"
                stroke="currentColor"
                strokeLinecap="round"
                className="text-primary/50"
                pathLength={100}
                strokeDasharray="27 73"
                strokeDashoffset="-58"
              />
              <circle
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                strokeWidth="5"
                stroke="currentColor"
                strokeLinecap="round"
                className="text-primary/25"
                pathLength={100}
                strokeDasharray="15 85"
                strokeDashoffset="-85"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold tabular-nums">%58</span>
            </div>
          </div>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <LegendItem label="Hisse" share="%58" tone="bg-primary" />
            <LegendItem label="Eurobond" share="%27" tone="bg-primary/50" />
            <LegendItem label="Nakit" share="%15" tone="bg-primary/25" />
          </ul>
        </div>
      </div>
    </div>
  );
}

function RateChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 tabular-nums">
      <span className="text-foreground/70">{label}</span>
      {value}
    </span>
  );
}

function LegendItem({
  label,
  share,
  tone,
}: {
  label: string;
  share: string;
  tone: string;
}) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden="true" className={`size-2 rounded-full ${tone}`} />
      {label}
      <span className="ml-auto pl-2 font-semibold text-foreground tabular-nums">
        {share}
      </span>
    </li>
  );
}
