"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProjectionResult } from "@/lib/assistant/engine";
import { formatCurrency } from "@/lib/format";

export function ProjectionCard({
  result,
  compare,
  compareLabel,
}: {
  result: ProjectionResult;
  compare?: ProjectionResult;
  compareLabel?: string;
}) {
  const data = result.series
    .filter((_, i) => i % 6 === 0 || i === result.series.length - 1)
    .map((p) => ({
      date: p.dateISO.slice(0, 7),
      portföy: Math.round(p.portfolioTRY),
      senaryo: compare
        ? Math.round(
            compare.series.find((c) => c.dateISO >= p.dateISO)?.portfolioTRY ??
              compare.series[compare.series.length - 1]?.portfolioTRY ??
              0,
          )
        : undefined,
    }));

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span>
          Hedef:{" "}
          <strong className="tabular-nums">
            {formatCurrency(result.fireNumberTRY)}
          </strong>
        </span>
        {result.fireDateISO && (
          <span className="text-primary-strong font-medium">
            Hedef tarihi: {new Date(result.fireDateISO).toLocaleDateString("tr-TR", {
              month: "long",
              year: "numeric",
            })}
          </span>
        )}
      </div>
      <div className="h-44" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickMargin={4} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : `${Math.round(v / 1000)}k`
              }
              width={44}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <ReferenceLine
              y={result.fireNumberTRY}
              stroke="var(--warning)"
              strokeDasharray="6 3"
              label={{
                value: "Özgürlük",
                fill: "var(--muted-foreground)",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
            <Line
              type="monotone"
              dataKey="portföy"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
            />
            {compare && (
              <Line
                type="monotone"
                dataKey="senaryo"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                name={compareLabel ?? "Senaryo"}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">
        Portföy projeksiyonu; hedef {formatCurrency(result.fireNumberTRY)}.
      </p>
    </div>
  );
}
