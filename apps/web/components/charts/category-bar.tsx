"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/shared";
import { buildCategoryRows, type ChartSlice } from "@/lib/chart-data";
import { formatCurrency } from "@/lib/format";

const compactNumber = new Intl.NumberFormat("tr-TR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

interface CategoryBarTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number | string; payload?: ChartSlice }>;
}

function CategoryBarTooltip({ active, payload }: CategoryBarTooltipProps) {
  const entry = active ? payload?.[0] : undefined;
  const row = entry?.payload;
  if (!entry || !row) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{row.label}</p>
      <p className="tabular-nums text-muted-foreground">
        {formatCurrency(Number(entry.value))}
      </p>
    </div>
  );
}

export function CategoryBar({
  byCategory,
}: {
  byCategory: Record<string, number>;
}) {
  const rows = buildCategoryRows(byCategory);
  const top = rows[0];

  if (rows.length === 0 || !top) {
    return <EmptyState title="Bu ay harcama verisi yok" />;
  }

  const height = Math.min(Math.max(rows.length * 36 + 30, 220), 300);
  const max = Math.max(...rows.map((row) => row.value));

  return (
    <div
      role="img"
      aria-label={`Harcama kategorileri grafiği. En yüksek harcama: ${top.label}, ${formatCurrency(top.value)}.`}
    >
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              horizontal={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <XAxis
              type="number"
              domain={[0, max * 1.05]}
              tickFormatter={(value: number) =>
                `₺${compactNumber.format(value)}`
              }
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={92}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CategoryBarTooltip />}
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            />
            <Bar
              dataKey="value"
              fill="var(--primary)"
              radius={[0, 4, 4, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
