const STATS = [
  { value: "9", label: "varlık sınıfı tek panelde" },
  { value: "27", label: "para birimi desteği" },
  { value: "7/24", label: "otomatik kur güncellemesi" },
  { value: "%100", label: "Türkçe ve sade arayüz" },
];

export function StatsStrip() {
  return (
    <section className="border-y bg-muted/50">
      <div className="container mx-auto grid grid-cols-2 gap-x-4 gap-y-8 px-4 py-10 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-primary sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
