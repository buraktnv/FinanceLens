"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { HistoryEvent } from "@/lib/assistant/history/matcher";

const REGION_LABEL: Record<HistoryEvent["region"], string> = {
  TR: "Türkiye",
  US: "ABD",
  GLOBAL: "Küresel",
};

export function HistoryFactsCard({
  intro,
  events,
}: {
  intro: string;
  events: HistoryEvent[];
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="mb-2 text-sm font-medium">{intro}</p>
      <ul className="space-y-2.5">
        {events.map((e) => (
          <li key={e.id} className="rounded-md border-l-2 border-primary/50 bg-muted/30 p-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                {REGION_LABEL[e.region]} {e.year}
              </Badge>
              <span
                className={
                  e.type === "boom"
                    ? "text-success"
                    : e.type === "stagflation"
                      ? "text-warning-foreground"
                      : "text-danger"
                }
              >
                {e.drawdownPct > 0 ? "+" : ""}
                %{Math.abs(e.drawdownPct)}
                {e.recoveryMonths !== null &&
                  ` · ${e.recoveryMonths} ayda toparlanma`}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium">{e.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{e.lesson}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TotalContextLine({ netWorth }: { netWorth: number }) {
  return (
    <span className="tabular-nums">{formatCurrency(netWorth)}</span>
  );
}
