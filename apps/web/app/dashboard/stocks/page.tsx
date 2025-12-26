"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Loader2, Pencil, Trash2, TrendingUp, BarChart3 } from "lucide-react";
import { stocksApi, Stock, yahooFinanceApi } from "@/lib/api";
import { AddStockForm } from "@/components/forms/add-stock-form";
import { EditStockForm } from "@/components/forms/edit-stock-form";
import { StockChart } from "@/components/stock-chart";

export default function StocksPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [deletingStock, setDeletingStock] = useState<Stock | null>(null);
  const [chartStock, setChartStock] = useState<Stock | null>(null);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});

  const { data: stocks = [], isLoading: stocksLoading, error: stocksError } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stocksApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["stocks", "summary"],
    queryFn: () => stocksApi.getSummary(),
  });

  const isLoading = stocksLoading || summaryLoading;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stocksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["stocks", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      setDeletingStock(null);
    },
  });

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number, currency = "TRY", decimals = 2) => {
    const symbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";
    return `${symbol}${value.toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  const handleDelete = () => {
    if (deletingStock) {
      deleteMutation.mutate(deletingStock.id);
    }
  };

  // Fetch current prices for all stocks
  useEffect(() => {
    const fetchPrices = async () => {
      if (stocks.length === 0) return;

      const prices: Record<string, number> = {};
      await Promise.all(
        stocks.map(async (stock) => {
          try {
            const quote = await yahooFinanceApi.getQuote(stock.symbol);
            prices[stock.symbol] = quote.regularMarketPrice;
          } catch (error) {
            console.error(`Failed to fetch price for ${stock.symbol}:`, error);
          }
        })
      );
      setCurrentPrices(prices);
    };

    fetchPrices();
    // Refresh prices every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [stocks]);

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
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
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
                  <TableHead className="text-right">Guncel Fiyat</TableHead>
                  <TableHead className="text-right">Toplam Deger</TableHead>
                  <TableHead className="text-right">Kar/Zarar</TableHead>
                  <TableHead className="text-right">Alis Tarihi</TableHead>
                  <TableHead className="text-right">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.map((stock) => {
                  const quantity = Number(stock.quantity);
                  const purchasePrice = Number(stock.purchasePrice);
                  const totalCost = quantity * purchasePrice;
                  const currentPrice = currentPrices[stock.symbol];
                  const currentValue = currentPrice ? quantity * currentPrice : null;
                  const profitLoss = currentValue ? currentValue - totalCost : null;
                  const profitLossPercent = profitLoss && totalCost > 0 ? (profitLoss / totalCost) * 100 : null;

                  return (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">{stock.symbol}</TableCell>
                      <TableCell>{stock.name}</TableCell>
                      <TableCell className="text-right">{quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(purchasePrice, stock.currency, 3)}</TableCell>
                      <TableCell className="text-right">
                        {currentPrice ? (
                          formatCurrency(currentPrice, stock.currency)
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin inline" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {currentValue ? formatCurrency(currentValue, stock.currency) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {profitLoss !== null ? (
                          <div className={profitLoss >= 0 ? "text-green-600" : "text-red-600"}>
                            <div className="font-medium">
                              {profitLoss >= 0 ? "+" : ""}{formatCurrency(profitLoss, stock.currency)}
                            </div>
                            {profitLossPercent !== null && (
                              <div className="text-xs">
                                ({profitLoss >= 0 ? "+" : ""}{profitLossPercent.toFixed(2)}%)
                              </div>
                            )}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Date(stock.purchaseDate).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setChartStock(stock)}
                            title="Grafik"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingStock(stock)}
                            title="Duzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingStock(stock)}
                            title="Sil"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
                <Button className="mt-4 gap-2" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Ilk Hissenizi Ekleyin
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Stock Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Hisse Ekle</DialogTitle>
            <DialogDescription>
              Yahoo Finance'dan sembol arayarak hisse senetlerinizi ekleyin
            </DialogDescription>
          </DialogHeader>
          <AddStockForm
            onSuccess={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Stock Dialog */}
      <Dialog open={!!editingStock} onOpenChange={(open) => !open && setEditingStock(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hisse Duzenle</DialogTitle>
            <DialogDescription>
              Hisse senedi bilgilerinizi guncelleyin
            </DialogDescription>
          </DialogHeader>
          {editingStock && (
            <EditStockForm
              stock={editingStock}
              onSuccess={() => setEditingStock(null)}
              onCancel={() => setEditingStock(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingStock} onOpenChange={(open) => !open && setDeletingStock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hisseyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingStock && (
                <>
                  <strong>{deletingStock.symbol} - {deletingStock.name}</strong> hissesini silmek istediginizden emin misiniz?
                  Bu islem geri alinamaz.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chart Dialog */}
      <Dialog open={!!chartStock} onOpenChange={(open) => !open && setChartStock(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {chartStock && (
            <StockChart
              symbol={chartStock.symbol}
              name={chartStock.name}
              currency={chartStock.currency}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
