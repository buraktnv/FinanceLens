import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, TrendingUp, TrendingDown } from "lucide-react";

const mockStocks = [
  { symbol: "THYAO", name: "Turk Hava Yollari", quantity: 500, avgPrice: 285.50, currentPrice: 312.40, currency: "TRY" },
  { symbol: "AAPL", name: "Apple Inc.", quantity: 25, avgPrice: 175.00, currentPrice: 192.50, currency: "USD" },
  { symbol: "GOOGL", name: "Alphabet Inc.", quantity: 10, avgPrice: 140.00, currentPrice: 155.20, currency: "USD" },
  { symbol: "ASELS", name: "Aselsan", quantity: 200, avgPrice: 52.80, currentPrice: 48.90, currency: "TRY" },
  { symbol: "MSFT", name: "Microsoft", quantity: 15, avgPrice: 380.00, currentPrice: 405.00, currency: "USD" },
];

export default function StocksPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hisse Senetleri</h1>
          <p className="text-muted-foreground">Hisse senedi portfoyunuzu yonetin</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Hisse Ekle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Deger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺485,230</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Kar/Zarar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+₺42,180</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Getiri Orani</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+9.52%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Hisse ara..." className="pl-10" />
        </div>
      </div>

      {/* Stocks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hisse Portfoyu</CardTitle>
          <CardDescription>Tum hisse senetleriniz</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sembol</TableHead>
                <TableHead>Sirket</TableHead>
                <TableHead className="text-right">Adet</TableHead>
                <TableHead className="text-right">Ort. Maliyet</TableHead>
                <TableHead className="text-right">Guncel Fiyat</TableHead>
                <TableHead className="text-right">Kar/Zarar</TableHead>
                <TableHead className="text-right">Getiri</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStocks.map((stock) => {
                const totalCost = stock.quantity * stock.avgPrice;
                const currentValue = stock.quantity * stock.currentPrice;
                const profitLoss = currentValue - totalCost;
                const profitLossPercent = ((profitLoss / totalCost) * 100).toFixed(2);
                const isProfit = profitLoss >= 0;
                const currencySymbol = stock.currency === "TRY" ? "₺" : "$";

                return (
                  <TableRow key={stock.symbol}>
                    <TableCell className="font-medium">{stock.symbol}</TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell className="text-right">{stock.quantity}</TableCell>
                    <TableCell className="text-right">{currencySymbol}{stock.avgPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{currencySymbol}{stock.currentPrice.toFixed(2)}</TableCell>
                    <TableCell className={`text-right ${isProfit ? "text-green-600" : "text-red-600"}`}>
                      {isProfit ? "+" : ""}{currencySymbol}{profitLoss.toFixed(2)}
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
    </div>
  );
}
