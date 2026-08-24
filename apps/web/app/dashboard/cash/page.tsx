"use client";

import { useState } from "react";
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
import { Plus, Search, Loader2, Pencil, Trash2, Wallet, Banknote } from "lucide-react";
import { cashApi, Cash } from "@/lib/api";
import { AddCashForm } from "@/components/forms/add-cash-form";
import { EditCashForm } from "@/components/forms/edit-cash-form";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
  TableSkeleton,
} from "@/components/shared";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function CashPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCash, setEditingCash] = useState<Cash | null>(null);
  const [deletingCash, setDeletingCash] = useState<Cash | null>(null);

  const {
    data: cashAccounts = [],
    isLoading: cashLoading,
    error: cashError,
    refetch: refetchCash,
  } = useQuery({
    queryKey: ["cash"],
    queryFn: () => cashApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["cash", "summary"],
    queryFn: () => cashApi.getSummary(),
  });

  const isLoading = cashLoading || summaryLoading;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cashApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash"] });
      queryClient.invalidateQueries({ queryKey: ["cash", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      toast.success("Cash account deleted successfully");
      setDeletingCash(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
      setDeletingCash(null);
    },
  });

  const filteredCash = cashAccounts.filter(
    (cash) =>
      cash.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cash.bankName && cash.bankName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = () => {
    if (deletingCash) {
      deleteMutation.mutate(deletingCash.id);
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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (cashError) {
    return (
      <ErrorState
        message={cashError instanceof Error ? cashError.message : undefined}
        onRetry={() => refetchCash()}
      />
    );
  }

  const totalBalance = summary?.totalBalance || 0;
  const totalAccounts = summary?.totalAccounts || 0;
  const byCurrency = summary?.byCurrency || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Cash Accounts"
        description="All your cash accounts"
        actions={
          <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add New Account
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <StatCard title="Total Accounts" value={totalAccounts} icon={Wallet} />
        <StatCard title="Total Balance" value={formatCurrency(totalBalance)} icon={Banknote} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Currencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {Object.entries(byCurrency).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between tabular-nums">
                  <span className="font-medium">{currency}:</span>
                  <span>{formatCurrency(amount, currency)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            className="pl-10 text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Cash Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Cash Accounts</CardTitle>
          <CardDescription className="text-sm">All your cash accounts</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filteredCash.length === 0 ? (
            <EmptyState title="No cash accounts added yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Account Name</TableHead>
                  <TableHead className="text-sm">Bank</TableHead>
                  <TableHead className="text-right text-sm">Balance</TableHead>
                  <TableHead className="text-sm">Currency</TableHead>
                  <TableHead className="text-sm">Account Type</TableHead>
                  <TableHead className="text-right text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCash.map((cash) => (
                  <TableRow key={cash.id}>
                    <TableCell className="font-medium">{cash.accountName}</TableCell>
                    <TableCell>{cash.bankName || "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(cash.balance, cash.currency)}</TableCell>
                    <TableCell>{cash.currency}</TableCell>
                    <TableCell className="text-sm">{cash.accountType || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCash(cash)}
                          title="Edit"
                          aria-label="Edit cash account"
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingCash(cash)}
                          title="Delete"
                          aria-label="Delete cash account"
                          className="text-red-600 hover:text-red-700 hover:bg-destructive/10 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Cash Account</DialogTitle>
            <DialogDescription>
              Enter your cash account details
            </DialogDescription>
          </DialogHeader>
          <AddCashForm
            onSuccess={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCash} onOpenChange={(open) => !open && setEditingCash(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Cash Account</DialogTitle>
            <DialogDescription>
              Update your cash account details
            </DialogDescription>
          </DialogHeader>
          {editingCash && (
            <EditCashForm
              cash={editingCash}
              onSuccess={() => setEditingCash(null)}
              onCancel={() => setEditingCash(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingCash} onOpenChange={(open) => !open && setDeletingCash(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The account will be permanently deleted.
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
