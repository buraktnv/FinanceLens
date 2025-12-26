"use client";

import { useState, useEffect } from "react";
import { yahooFinanceApi } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StockChartProps {
  symbol: string;
  name: string;
  currency: string;
}

type TimeRange = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "5y";

const timeRanges: Record<TimeRange, { label: string; days: number; interval: string }> = {
  "1d": { label: "1 Gun", days: 1, interval: "5m" },
  "5d": { label: "5 Gun", days: 5, interval: "15m" },
  "1mo": { label: "1 Ay", days: 30, interval: "1h" },
  "3mo": { label: "3 Ay", days: 90, interval: "1d" },
  "6mo": { label: "6 Ay", days: 180, interval: "1d" },
  "1y": { label: "1 Yil", days: 365, interval: "1d" },
  "5y": { label: "5 Yil", days: 1825, interval: "1wk" },
};

export function StockChart({ symbol, name, currency }: StockChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("1mo");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yAxisDomain, setYAxisDomain] = useState<[number, number]>([0, 100]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const range = timeRanges[timeRange];
        const now = Math.floor(Date.now() / 1000);
        const start = now - range.days * 24 * 60 * 60;

        const result = await yahooFinanceApi.getHistorical(symbol, start, now, range.interval);

        if (result.timestamp && result.indicators?.quote?.[0]?.close) {
          const timestamps = result.timestamp;
          const closes = result.indicators.quote[0].close;

          const chartData = timestamps
            .map((ts: number, i: number) => ({
              date: new Date(ts * 1000).toLocaleDateString("tr-TR", {
                month: "short",
                day: "numeric",
                ...(timeRange === "1d" ? { hour: "2-digit", minute: "2-digit" } : {}),
              }),
              price: closes[i],
            }))
            .filter((d: any) => d.price !== null);

          const prices = chartData.map((d) => d.price);
          const maxPrice = Math.max(...prices);
          const minPrice = Math.min(...prices);

          const padding = maxPrice * 0.1;

          const yMax = maxPrice + padding;
          const yMin = minPrice - padding;

          setYAxisDomain([yMin, yMax]);
          setData(chartData);
        } else {
          setError("Veri bulunamadi");
        }
      } catch (err) {
        setError("Fiyat verisi yuklenirken hata olustu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeRange]);

  const currencySymbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {symbol} - {name}
            </CardTitle>
            <CardDescription>Fiyat Gecmisi</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(timeRanges).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96 text-red-600">{error}</div>
        ) : (
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#666"
              />
              <YAxis
                domain={yAxisDomain}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `${currencySymbol}${value.toFixed(2)}`}
                stroke="#666"
                width={80}
                tickCount={8}
              />
              <Tooltip
                formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, "Fiyat"]}
                labelStyle={{ color: "#000" }}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={false}
                name="Fiyat"
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
