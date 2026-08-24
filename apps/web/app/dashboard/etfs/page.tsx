"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Pencil, Trash2, Wallet, TrendingUp, Layers } from "lucide-react";
import { etfsApi, ETF } from "@/lib/api";
import { AddETFForm } from "@/components/forms/add-etf-form";
import { EditETFForm } from "@/components/forms/edit-etf-form";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
  TableSkeleton,
} from "@/components/shared";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function ETFsPage() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEtf, setEditingEtf] = useState<ETF | null>(null);
  const [deletingEtf, setDeletingEtf] = useState<ETF | null>(null);
  const {
    data: etfs = [],
    isLoading: etfsLoading,
    error: etfsError,
    refetch: refetchEtfs,
  } = useQuery({
    queryKey: ["etfs"],
    queryFn: () => etfsApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["etfs", "summary"],
    queryFn: () => etfsApi.getSummary(),
  });

  const isLoading = etfsLoading || summaryLoading;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => etfsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etfs"] });
      queryClient.invalidateQueries({ queryKey: ["etfs", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      toast.success("ETF deleted successfully");
      setDeletingEtf(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
      setDeletingEtf(null);
    },
  });

  const handleDelete = () => {
    if (deletingEtf) {
      deleteMutation.mutate(deletingEtf.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-20 sm:h-9" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-full sm:w-36" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (etfsError) {
    return (
      <ErrorState
        message={etfsError instanceof Error ? etfsError.message : undefined}
        onRetry={() => refetchEtfs()}
      />
    );
  }

  const totalValue = summary?.totalValue ?? 0;
  const totalDistributions = summary?.totalDistributions ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="ETFs"
        description="Manage your ETF portfolio"
        actions={
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Add New ETF
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <StatCard title="Total Value" value={formatCurrency(totalValue)} icon={Wallet} />
        <StatCard
          title="Total Distributions"
          value={formatCurrency(totalDistributions)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard title="ETF Count" value={summary?.totalEtfs ?? 0} icon={Layers} />
      </div>

      {/* ETFs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">ETF Portfolio</CardTitle>
          <CardDescription className="text-sm">All your ETFs</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {etfs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Symbol</TableHead>
                  <TableHead className="text-sm">ETF Name</TableHead>
                  <TableHead className="text-right text-sm">Quantity</TableHead>
                  <TableHead className="text-right text-sm">Purchase Price</TableHead>
                  <TableHead className="text-right text-sm">Expense Ratio</TableHead>
                  <TableHead className="text-right text-sm">Total Cost</TableHead>
                  <TableHead className="text-right text-sm">Purchase Date</TableHead>
                  <TableHead className="text-right text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {etfs.map((etf) => {
                  const quantity = Number(etf.quantity);
                  const purchasePrice = Number(etf.purchasePrice);
                  const totalCost = quantity * purchasePrice;
                  const expenseRatio = etf.expenseRatio ? Number(etf.expenseRatio) * 100 : null;

                  return (
                    <TableRow key={etf.id}>
                      <TableCell className="font-medium">{etf.symbol}</TableCell>
                      <TableCell>{etf.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(purchasePrice, etf.currency)}</TableCell>
                      <TableCell className="text-right">
                        {expenseRatio !== null ? (
                          <Badge variant="outline" className="tabular-nums">{formatPercent(expenseRatio)}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatCurrency(totalCost, etf.currency)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatDate(etf.purchaseDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingEtf(etf)}
                            title="Edit"
                            aria-label="Edit ETF"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingEtf(etf)}
                            title="Delete"
                            aria-label="Delete ETF"
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
          ) : (
            <EmptyState
              title="No ETFs added yet"
              action={
                <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Add Your First ETF
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Add ETF Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New ETF</DialogTitle>
            <DialogDescription>
              Search for ETF symbols from Yahoo Finance to add to your portfolio
            </DialogDescription>
          </DialogHeader>
          <AddETFForm
            onSuccess={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit ETF Dialog */}
      <Dialog open={!!editingEtf} onOpenChange={(open) => !open && setEditingEtf(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit ETF</DialogTitle>
            <DialogDescription>
              Update your ETF information
            </DialogDescription>
          </DialogHeader>
          {editingEtf && (
            <EditETFForm
              etf={editingEtf}
              onSuccess={() => setEditingEtf(null)}
              onCancel={() => setEditingEtf(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEtf} onOpenChange={(open) => !open && setDeletingEtf(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ETF</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingEtf && (
                <>
                  Are you sure you want to delete <strong>{deletingEtf.symbol} - {deletingEtf.name}</strong>?
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

      {/* Distributions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recent Distributions</CardTitle>
          <CardDescription className="text-sm">Your ETF dividends and distributions</CardDescription>
        </CardHeader>
        <CardContent>
          {etfs.some(e => e.distributions && e.distributions.length > 0) ? (
            <div className="space-y-4">
              {etfs.flatMap(etf =>
                (etf.distributions || []).map(dist => (
                  <DistributionItem
                    key={dist.id}
                    etf={etf.symbol}
                    type={dist.type}
                    date={formatDate(dist.paymentDate)}
                    amount={formatCurrency(Number(dist.amount), dist.currency)}
                  />
                ))
              ).slice(0, 5)}
            </div>
          ) : (
            <p className="text-sm sm:text-base text-muted-foreground text-center py-4">No distributions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DistributionItem({ etf, type, date, amount }: { etf: string; type: string; date: string; amount: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div>
        <p className="font-medium">{etf} - {type}</p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <span className="font-medium text-green-600 tabular-nums">{amount}</span>
    </div>
  );
}
