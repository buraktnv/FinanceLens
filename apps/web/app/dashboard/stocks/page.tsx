"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Plus, Search, Loader2 } from "lucide-react";
import { stocksApi } from "@/lib/api";

export default function StocksPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: stocks = [], isLoading: stocksLoading, error: stocksError } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stocksApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["stocks", "summary"],
    queryFn: () => stocksApi.getSummary(),
  });

  const isLoading = stocksLoading || summaryLoading;

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number, currency = "TRY") => {
    const symbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";
    return `${symbol}${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (stocksError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">
          {stocksError instanceof Error ? stocksError.message : "Veri yuklenirken hata olustu"}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tekrar Dene
        </Button>
      </div>
    );
  }

  const totalCost = summary?.totalCost ?? 0;
  const totalDividends = summary?.totalDividends ?? 0;

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Maliyet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{totalCost.toLocaleString("tr-TR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Temettu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₺{totalDividends.toLocaleString("tr-TR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hisse Sayisi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalStocks ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Hisse ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stocks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hisse Portfoyu</CardTitle>
          <CardDescription>Tum hisse senetleriniz</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStocks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sembol</TableHead>
                  <TableHead>Sirket</TableHead>
                  <TableHead className="text-right">Adet</TableHead>
                  <TableHead className="text-right">Alis Fiyati</TableHead>
                  <TableHead className="text-right">Toplam Maliyet</TableHead>
                  <TableHead className="text-right">Alis Tarihi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.map((stock) => {
                  const quantity = Number(stock.quantity);
                  const purchasePrice = Number(stock.purchasePrice);
                  const totalCost = quantity * purchasePrice;

                  return (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">{stock.symbol}</TableCell>
                      <TableCell>{stock.name}</TableCell>
                      <TableCell className="text-right">{quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(purchasePrice, stock.currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalCost, stock.currency)}</TableCell>
                      <TableCell className="text-right">
                        {new Date(stock.purchaseDate).toLocaleDateString("tr-TR")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "Aramanizla eslesen hisse bulunamadi" : "Henuz hisse eklenmedi"}
              </p>
              {!searchTerm && (
                <Button className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Ilk Hissenizi Ekleyin
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
