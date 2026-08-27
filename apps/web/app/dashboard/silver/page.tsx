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
import { silverApi, preciousMetalsApi, Silver } from "@/lib/api";
import { ImageImportButton } from "@/components/import/image-import-dialog";
import { AddSilverForm } from "@/components/forms/add-silver-form";
import { EditSilverForm } from "@/components/forms/edit-silver-form";
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

export default function SilverPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSilver, setEditingSilver] = useState<Silver | null>(null);
  const [deletingSilver, setDeletingSilver] = useState<Silver | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    data: holdings = [],
    isLoading: holdingsLoading,
    error: holdingsError,
    refetch: refetchHoldings,
  } = useQuery({
    queryKey: ["silver"],
    queryFn: () => silverApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["silver", "summary"],
    queryFn: () => silverApi.getSummary(),
  });

  const isLoading = holdingsLoading || summaryLoading;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => silverApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["silver"] });
      queryClient.invalidateQueries({ queryKey: ["silver", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      toast.success("Silver holding deleted successfully");
      setDeletingSilver(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
      setDeletingSilver(null);
    },
  });

  // Fetch current silver price every 15 minutes
  useEffect(() => {
    let cancelled = false;

    const fetchPrice = async () => {
      try {
        const priceData = await preciousMetalsApi.getSilverPrice();
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

  const filteredHoldings = holdings.filter((silver) =>
    silver.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = () => {
    if (deletingSilver) {
      deleteMutation.mutate(deletingSilver.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-52 sm:h-9" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-full sm:w-44" />
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
        title="Silver Portfolio"
        description="All your silver assets"
        actions={
          <>
            <ImageImportButton
              targetType="silver"
              targetLabel="Gümüş"
              fieldOrder={["name", "quantity", "purchasePrice", "currency"]}
              onCommit={async (rows) => {
                for (const row of rows) {
                  await silverApi.create({
                    name: String(row.name ?? ""),
                    quantity: Number(row.quantity ?? 0),
                    purchasePrice: Number(row.purchasePrice ?? 0),
                    purchaseDate: new Date().toISOString().slice(0, 10),
                  });
                }
                queryClient.invalidateQueries({ queryKey: ["silver"] });
                queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
              }}
            />
            <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add New Silver
            </Button>
          </>
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
            placeholder="Search silver..."
            className="pl-10 text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Silver Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Silver Portfolio</CardTitle>
          <CardDescription className="text-sm">All your silver assets</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filteredHoldings.length === 0 ? (
            <EmptyState title="No silver added yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Silver Name</TableHead>
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
                {filteredHoldings.map((silver) => {
                  const quantity = Number(silver.quantity);
                  const purchasePrice = Number(silver.purchasePrice);
                  const cost = quantity * purchasePrice;
                  const current = currentPrice ? quantity * currentPrice : cost;
                  const profit = currentPrice ? current - cost : 0;
                  const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;

                  return (
                    <TableRow key={silver.id}>
                      <TableCell className="font-medium">{silver.name}</TableCell>
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
                      <TableCell className="text-sm">{silver.purity || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSilver(silver)}
                            title="Edit"
                            aria-label="Edit silver holding"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingSilver(silver)}
                            title="Delete"
                            aria-label="Delete silver holding"
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
            <DialogTitle>Add New Silver</DialogTitle>
            <DialogDescription>
              Enter your silver asset details
            </DialogDescription>
          </DialogHeader>
          <AddSilverForm
            onSuccess={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingSilver} onOpenChange={(open) => !open && setEditingSilver(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Silver</DialogTitle>
            <DialogDescription>
              Update your silver asset details
            </DialogDescription>
          </DialogHeader>
          {editingSilver && (
            <EditSilverForm
              silver={editingSilver}
              onSuccess={() => setEditingSilver(null)}
              onCancel={() => setEditingSilver(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingSilver} onOpenChange={(open) => !open && setDeletingSilver(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Silver?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The silver asset will be permanently deleted.
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
