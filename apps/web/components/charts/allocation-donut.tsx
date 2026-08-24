"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { EmptyState } from "@/components/shared";
import {
  buildAllocationSlices,
  sumSlices,
  type AllocationBreakdown,
  type ChartSlice,
} from "@/lib/chart-data";
import { formatCurrency, formatPercent } from "@/lib/format";

const SLICE_COLORS: Record<string, string> = {
  cash: "var(--primary)",
  stocks: "var(--chart-1)",
  etfs: "var(--chart-2)",
  eurobonds: "var(--chart-3)",
  gold: "var(--chart-4)",
  silver: "var(--chart-5)",
};

interface DonutTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number | string; payload?: ChartSlice }>;
  total: number;
}

function DonutTooltip({ active, payload, total }: DonutTooltipProps) {
  const entry = active ? payload?.[0] : undefined;
  const slice = entry?.payload;
  if (!entry || !slice) return null;
  const value = Number(entry.value);
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{slice.label}</p>
      <p className="tabular-nums text-muted-foreground">
        {formatCurrency(value)}
        {total > 0 ? ` (${formatPercent((value / total) * 100)})` : ""}
      </p>
    </div>
  );
}

export function AllocationDonut({
  breakdown,
}: {
  breakdown: AllocationBreakdown;
}) {
  const slices = buildAllocationSlices(breakdown);
  const total = sumSlices(slices);

  if (slices.length === 0 || total === 0) {
    return <EmptyState title="Henuz varlik eklenmedi" />;
  }

  return (
    <div
      role="img"
      aria-label={`Portföy dağılımı grafiği. Toplam varlık değeri ${formatCurrency(total)}.`}
    >
      <div aria-hidden="true" className="relative">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Tooltip content={<DonutTooltip total={total} />} />
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {slices.map((slice) => (
                <Cell
                  key={slice.key}
                  fill={SLICE_COLORS[slice.key] ?? "var(--primary)"}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Toplam</span>
          <span className="text-lg font-bold tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {slices.map((slice) => (
          <li
            key={slice.key}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: SLICE_COLORS[slice.key] ?? "var(--primary)",
              }}
            />
            {slice.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
