import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";

const mockETFs = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF", quantity: 20, avgPrice: 450.00, currentPrice: 478.50, expenseRatio: 0.09, currency: "USD" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", quantity: 15, avgPrice: 380.00, currentPrice: 412.30, expenseRatio: 0.20, currency: "USD" },
  { symbol: "VTI", name: "Vanguard Total Stock", quantity: 30, avgPrice: 220.00, currentPrice: 238.90, expenseRatio: 0.03, currency: "USD" },
  { symbol: "ACWI", name: "iShares MSCI ACWI", quantity: 50, avgPrice: 98.00, currentPrice: 105.20, expenseRatio: 0.32, currency: "USD" },
];

export default function ETFsPage() {
  const totalValue = mockETFs.reduce((sum, etf) => sum + (etf.quantity * etf.currentPrice), 0);
  const totalCost = mockETFs.reduce((sum, etf) => sum + (etf.quantity * etf.avgPrice), 0);
  const totalProfit = totalValue - totalCost;
  const profitPercent = ((totalProfit / totalCost) * 100).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ETF'ler</h1>
          <p className="text-muted-foreground">ETF portfoyunuzu yonetin</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni ETF Ekle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Deger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Maliyet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kar/Zarar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totalProfit >= 0 ? "+" : ""}${totalProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Getiri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totalProfit >= 0 ? "+" : ""}{profitPercent}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ETFs Table */}
      <Card>
        <CardHeader>
          <CardTitle>ETF Portfoyu</CardTitle>
          <CardDescription>Tum ETF'leriniz</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sembol</TableHead>
                <TableHead>ETF Adi</TableHead>
                <TableHead className="text-right">Adet</TableHead>
                <TableHead className="text-right">Ort. Maliyet</TableHead>
                <TableHead className="text-right">Guncel Fiyat</TableHead>
                <TableHead className="text-right">Gider Orani</TableHead>
                <TableHead className="text-right">Kar/Zarar</TableHead>
                <TableHead className="text-right">Getiri</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockETFs.map((etf) => {
                const totalCost = etf.quantity * etf.avgPrice;
                const currentValue = etf.quantity * etf.currentPrice;
                const profitLoss = currentValue - totalCost;
                const profitLossPercent = ((profitLoss / totalCost) * 100).toFixed(2);
                const isProfit = profitLoss >= 0;

                return (
                  <TableRow key={etf.symbol}>
                    <TableCell className="font-medium">{etf.symbol}</TableCell>
                    <TableCell>{etf.name}</TableCell>
                    <TableCell className="text-right">{etf.quantity}</TableCell>
                    <TableCell className="text-right">${etf.avgPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${etf.currentPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">%{etf.expenseRatio}</Badge>
                    </TableCell>
                    <TableCell className={`text-right ${isProfit ? "text-green-600" : "text-red-600"}`}>
                      {isProfit ? "+" : ""}${profitLoss.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isProfit ? "default" : "destructive"} className="gap-1">
                        {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isProfit ? "+" : ""}{profitLossPercent}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Distributions */}
      <Card>
        <CardHeader>
          <CardTitle>Son Dagitimlar</CardTitle>
          <CardDescription>ETF temettu ve dagitimlariniz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <DistributionItem etf="SPY" type="Temettu" date="15 Ocak 2024" amount="$45.60" />
            <DistributionItem etf="VTI" type="Temettu" date="10 Ocak 2024" amount="$28.30" />
            <DistributionItem etf="QQQ" type="Temettu" date="5 Ocak 2024" amount="$12.15" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DistributionItem({ etf, type, date, amount }: { etf: string; type: string; date: string; amount: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium">{etf} - {type}</p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <span className="font-medium text-green-600">{amount}</span>
    </div>
  );
}
