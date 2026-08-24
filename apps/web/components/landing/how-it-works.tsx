const STEPS = [
  {
    number: "01",
    title: "Ekle",
    description:
      "Varlıklarını ve işlemlerini dakikalar içinde sisteme gir; hazır kategori şablonları işini hızlandırır.",
  },
  {
    number: "02",
    title: "Takip Et",
    description:
      "Canlı kurlar ve fiyatlar sayesinde portföyün her sabah kendiliğinden güncellenir.",
  },
  {
    number: "03",
    title: "Karar Ver",
    description:
      "Runway, tasarruf ve vergi hesaplarıyla veriye dayanan sağlam adımlar at.",
  },
];

export function HowItWorks() {
  return (
    <section id="nasil-calisir" className="scroll-mt-24 border-y bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Nasıl Çalışır
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Üç adımda finansal netlik
          </h2>
        </div>
        <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-7 hidden border-t border-dashed md:block"
          />
          {STEPS.map((step) => (
            <li key={step.number} className="relative text-center">
              <div className="relative z-10 mx-auto flex size-14 items-center justify-center rounded-full border bg-background font-mono text-lg font-semibold text-primary shadow-sm">
                {step.number}
              </div>
              <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
