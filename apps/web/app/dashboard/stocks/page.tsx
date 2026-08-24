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
import { Plus, Search, Loader2, Pencil, Trash2, BarChart3, Wallet, TrendingUp, Layers } from "lucide-react";
import { stocksApi, Stock, yahooFinanceApi } from "@/lib/api";
import { AddStockForm } from "@/components/forms/add-stock-form";
import { EditStockForm } from "@/components/forms/edit-stock-form";
import { StockChart } from "@/components/stock-chart";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
  TableSkeleton,
} from "@/components/shared";
import { toast } from "sonner";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function StocksPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [deletingStock, setDeletingStock] = useState<Stock | null>(null);
  const [chartStock, setChartStock] = useState<Stock | null>(null);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});

  const {
    data: stocks = [],
    isLoading: stocksLoading,
    error: stocksError,
    refetch: refetchStocks,
  } = useQuery({
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
      toast.success("Stock deleted successfully");
      setDeletingStock(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
      setDeletingStock(null);
    },
  });

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = () => {
    if (deletingStock) {
      deleteMutation.mutate(deletingStock.id);
    }
  };

  // Fetch current prices for all stocks
  useEffect(() => {
    let cancelled = false;

    const fetchPrices = async () => {
      if (stocks.length === 0) return;

      const prices: Record<string, number> = {};
      await Promise.all(
        stocks.map(async (stock) => {
          try {
            const quote = await yahooFinanceApi.getQuote(stock.symbol);
            prices[stock.symbol] = quote.regularMarketPrice;
          } catch {
            // Price unavailable for this symbol — skip silently
          }
        })
      );
      if (!cancelled) {
        setCurrentPrices(prices);
      }
    };

    fetchPrices();
    // Refresh prices every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // Prices are keyed by symbol; only re-create the fetch loop when holdings are added/removed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks.length]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-36 sm:h-9" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-full sm:w-40" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (stocksError) {
    return (
      <ErrorState
        message={
          stocksError instanceof Error ? stocksError.message : undefined
        }
        onRetry={() => refetchStocks()}
      />
    );
  }

  const totalCost = summary?.totalCost ?? 0;
  const totalDividends = summary?.totalDividends ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Stocks"
        description="Manage your stock portfolio"
        actions={
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Add New Stock
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <StatCard title="Total Cost" value={formatCurrency(totalCost)} icon={Wallet} />
        <StatCard
          title="Total Dividends"
          value={formatCurrency(totalDividends)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard title="Stock Count" value={summary?.totalStocks ?? 0} icon={Layers} />
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search stocks..."
            aria-label="Search stocks"
            className="pl-10 text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stocks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Stock Portfolio</CardTitle>
          <CardDescription className="text-sm">All your stocks</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filteredStocks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Symbol</TableHead>
                  <TableHead className="text-sm">Company</TableHead>
                  <TableHead className="text-right text-sm">Quantity</TableHead>
                  <TableHead className="text-right text-sm">Purchase Price</TableHead>
                  <TableHead className="text-right text-sm">Current Price</TableHead>
                  <TableHead className="text-right text-sm">Total Value</TableHead>
                  <TableHead className="text-right text-sm">Profit/Loss</TableHead>
                  <TableHead className="text-right text-sm">Purchase Date</TableHead>
                  <TableHead className="text-right text-sm">Actions</TableHead>
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
                      <TableCell className="text-right tabular-nums">{quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(purchasePrice, stock.currency)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {currentPrice ? (
                          formatCurrency(currentPrice, stock.currency)
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin inline" />
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {currentValue ? formatCurrency(currentValue, stock.currency) : "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {profitLoss !== null ? (
                          <div className={profitLoss >= 0 ? "text-green-600" : "text-red-600"}>
                            <div className="font-medium">
                              {profitLoss >= 0 ? "+" : ""}{formatCurrency(profitLoss, stock.currency)}
                            </div>
                            {profitLossPercent !== null && (
                              <div className="text-xs">
                                ({profitLoss >= 0 ? "+" : ""}{formatPercent(profitLossPercent)})
                              </div>
                            )}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatDate(stock.purchaseDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setChartStock(stock)}
                            title="Chart"
                            aria-label="Show chart"
                            className="h-8 w-8"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingStock(stock)}
                            title="Edit"
                            aria-label="Edit stock"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingStock(stock)}
                            title="Delete"
                            aria-label="Delete stock"
                            className="text-red-600 hover:text-red-700 hover:bg-destructive/10 h-8 w-8"
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
          ) : searchTerm ? (
            <EmptyState title="No stocks found matching your search" />
          ) : (
            <EmptyState
              title="No stocks added yet"
              action={
                <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Add Your First Stock
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Add Stock Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Stock</DialogTitle>
            <DialogDescription>
              Search for stock symbols from Yahoo Finance to add to your portfolio
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
            <DialogTitle>Edit Stock</DialogTitle>
            <DialogDescription>
              Update your stock information
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
            <AlertDialogTitle>Delete Stock</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingStock && (
                <>
                  Are you sure you want to delete <strong>{deletingStock.symbol} - {deletingStock.name}</strong>?
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
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
