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
import { Plus, Search, Loader2, Pencil, Trash2, TrendingUp, TrendingDown, Scale, Wallet, Banknote } from "lucide-react";
import { goldApi, preciousMetalsApi, Gold } from "@/lib/api";
import { AddGoldForm } from "@/components/forms/add-gold-form";
import { EditGoldForm } from "@/components/forms/edit-gold-form";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
  TableSkeleton,
} from "@/components/shared";
import { toast } from "sonner";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function GoldPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGold, setEditingGold] = useState<Gold | null>(null);
  const [deletingGold, setDeletingGold] = useState<Gold | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    data: holdings = [],
    isLoading: holdingsLoading,
    error: holdingsError,
    refetch: refetchHoldings,
  } = useQuery({
    queryKey: ["gold"],
    queryFn: () => goldApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["gold", "summary"],
    queryFn: () => goldApi.getSummary(),
  });

  const isLoading = holdingsLoading || summaryLoading;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goldApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gold"] });
      queryClient.invalidateQueries({ queryKey: ["gold", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      toast.success("Gold holding deleted successfully");
      setDeletingGold(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
      setDeletingGold(null);
    },
  });

  // Fetch current gold price every 15 minutes
  useEffect(() => {
    let cancelled = false;

    const fetchPrice = async () => {
      try {
        const priceData = await preciousMetalsApi.getGoldPrice();
        if (!cancelled) {
          setCurrentPrice(priceData.pricePerGram);
          setLastUpdated(new Date());
        }
      } catch {
        // Price fetch failed — keep last known price
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 15 * 60 * 1000); // 15 minutes

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const filteredHoldings = holdings.filter((gold) =>
    gold.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = () => {
    if (deletingGold) {
      deleteMutation.mutate(deletingGold.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-44 sm:h-9" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-9 w-full sm:w-40" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (holdingsError) {
    return (
      <ErrorState
        message={
          holdingsError instanceof Error ? holdingsError.message : undefined
        }
        onRetry={() => refetchHoldings()}
      />
    );
  }

  const totalQuantity = summary?.totalQuantity || 0;
  const totalCost = summary?.totalCost || 0;
  const currentValue = currentPrice ? totalQuantity * currentPrice : totalCost;
  const profitLoss = currentPrice ? currentValue - totalCost : 0;
  const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Gold Portfolio"
        description="All your gold assets"
        actions={
          <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add New Gold
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <StatCard title="Total Grams" value={`${totalQuantity.toFixed(3)} g`} icon={Scale} />
        <StatCard title="Total Cost" value={formatCurrency(totalCost, "TRY")} icon={Wallet} />
        <StatCard
          title="Current Value"
          value={formatCurrency(currentValue, "TRY")}
          hint={
            currentPrice
              ? `${formatCurrency(currentPrice, "TRY")}/gram${
                  lastUpdated ? ` (Updated: ${lastUpdated.toLocaleTimeString("en-US")})` : ""
                }`
              : undefined
          }
          icon={Banknote}
        />
        <StatCard
          title="Profit/Loss"
          value={formatCurrency(Math.abs(profitLoss), "TRY")}
          hint={`${profitLoss >= 0 ? "+" : "-"}${formatPercent(Math.abs(profitLossPercent))}`}
          icon={profitLoss >= 0 ? TrendingUp : TrendingDown}
          tone={profitLoss >= 0 ? "success" : "danger"}
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search gold..."
            className="pl-10 text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Gold Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Gold Portfolio</CardTitle>
          <CardDescription className="text-sm">All your gold assets</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filteredHoldings.length === 0 ? (
            <EmptyState title="No gold added yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Gold Name</TableHead>
                  <TableHead className="text-right text-sm">Grams</TableHead>
                  <TableHead className="text-right text-sm">Purchase Price</TableHead>
                  <TableHead className="text-right text-sm">Current Price</TableHead>
                  <TableHead className="text-right text-sm">Current Value</TableHead>
                  <TableHead className="text-right text-sm">Profit/Loss</TableHead>
                  <TableHead className="text-sm">Purity</TableHead>
                  <TableHead className="text-right text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHoldings.map((gold) => {
                  const quantity = Number(gold.quantity);
                  const purchasePrice = Number(gold.purchasePrice);
                  const cost = quantity * purchasePrice;
                  const current = currentPrice ? quantity * currentPrice : cost;
                  const profit = currentPrice ? current - cost : 0;
                  const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;

                  return (
                    <TableRow key={gold.id}>
                      <TableCell className="font-medium">{gold.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{quantity.toFixed(3)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(purchasePrice, "TRY")}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {currentPrice ? formatCurrency(currentPrice, "TRY") : "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(current, "TRY")}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {currentPrice ? (
                          <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(profit, "TRY")} ({profitPercent >= 0 ? '+' : ''}{formatPercent(profitPercent)})
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{gold.purity || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingGold(gold)}
                            title="Edit"
                            aria-label="Edit gold holding"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingGold(gold)}
                            title="Delete"
                            aria-label="Delete gold holding"
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
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Gold</DialogTitle>
            <DialogDescription>
              Enter your gold asset details
            </DialogDescription>
          </DialogHeader>
          <AddGoldForm
            onSuccess={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingGold} onOpenChange={(open) => !open && setEditingGold(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Gold</DialogTitle>
            <DialogDescription>
              Update your gold asset details
            </DialogDescription>
          </DialogHeader>
          {editingGold && (
            <EditGoldForm
              gold={editingGold}
              onSuccess={() => setEditingGold(null)}
              onCancel={() => setEditingGold(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingGold} onOpenChange={(open) => !open && setDeletingGold(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gold?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The gold asset will be permanently deleted.
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
    </div>
  );
}
