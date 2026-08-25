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
import { Plus, Calendar, Loader2, Pencil, Trash2, Wallet, Banknote, TrendingUp, Percent } from "lucide-react";
import { eurobondsApi, Eurobond } from "@/lib/api";
import { ImageImportButton } from "@/components/import/image-import-dialog";
import { AddEurobondForm } from "@/components/forms/add-eurobond-form";
import { EditEurobondForm } from "@/components/forms/edit-eurobond-form";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
  TableSkeleton,
} from "@/components/shared";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function EurobondsPage() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEurobond, setEditingEurobond] = useState<Eurobond | null>(null);
  const [deletingEurobond, setDeletingEurobond] = useState<Eurobond | null>(null);
  const {
    data: eurobonds = [],
    isLoading: bondsLoading,
    error: bondsError,
    refetch: refetchBonds,
  } = useQuery({
    queryKey: ["eurobonds"],
    queryFn: () => eurobondsApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["eurobonds", "summary"],
    queryFn: () => eurobondsApi.getSummary(),
  });

  const isLoading = bondsLoading || summaryLoading;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eurobondsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eurobonds"] });
      queryClient.invalidateQueries({ queryKey: ["eurobonds", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      toast.success("Eurobond deleted successfully");
      setDeletingEurobond(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
      setDeletingEurobond(null);
    },
  });

  const handleDelete = () => {
    if (deletingEurobond) {
      deleteMutation.mutate(deletingEurobond.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32 sm:h-9" />
            <Skeleton className="h-4 w-60" />
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

  if (bondsError) {
    return (
      <ErrorState
        message={bondsError instanceof Error ? bondsError.message : undefined}
        onRetry={() => refetchBonds()}
      />
    );
  }

  const totalFaceValue = summary?.totalFaceValue ?? 0;
  const totalCurrentValue = summary?.totalCurrentValue ?? 0;
  const annualCouponIncome = summary?.annualCouponIncome ?? 0;
  const avgYield = totalFaceValue > 0 ? (annualCouponIncome / totalFaceValue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Eurobonds"
        description="Manage your eurobond portfolio"
        actions={
          <>
            <ImageImportButton
              targetType="eurobond"
              targetLabel="Eurobond"
              fieldOrder={["name", "faceValue", "quantity", "couponRate", "currency", "maturityDate"]}
              onCommit={async (rows) => {
                for (const row of rows) {
                  await eurobondsApi.create({
                    name: String(row.name ?? ""),
                    faceValue: Number(row.faceValue ?? 0),
                    quantity: Number(row.quantity ?? 1),
                    purchasePrice: Number(row.faceValue ?? 0),
                    couponRate: Number(row.couponRate ?? 0),
                    currency: (row.currency as Eurobond["currency"]) || "USD",
                    purchaseDate: new Date().toISOString().slice(0, 10),
                    maturityDate: row.maturityDate
                      ? String(row.maturityDate)
                      : new Date(Date.now() + 5 * 365.25 * 86400000)
                          .toISOString()
                          .slice(0, 10),
                  });
                }
                queryClient.invalidateQueries({ queryKey: ["eurobonds"] });
                queryClient.invalidateQueries({ queryKey: ["eurobonds", "summary"] });
                queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
              }}
            />
            <Button className="gap-2 w-full sm:w-auto" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4" />
              Add New Eurobond
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <StatCard title="Face Value" value={formatCurrency(totalFaceValue)} icon={Wallet} />
        <StatCard title="Current Value" value={formatCurrency(totalCurrentValue)} icon={Banknote} />
        <StatCard
          title="Annual Coupon Income"
          value={formatCurrency(annualCouponIncome)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard title="Average Yield" value={formatPercent(avgYield)} icon={Percent} />
      </div>

      {/* Eurobonds Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Eurobond Portfolio</CardTitle>
          <CardDescription className="text-sm">All your eurobonds</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {eurobonds.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Bond</TableHead>
                  <TableHead className="text-sm">ISIN</TableHead>
                  <TableHead className="text-right text-sm">Face Value</TableHead>
                  <TableHead className="text-right text-sm">Purchase Price</TableHead>
                  <TableHead className="text-right text-sm">Coupon</TableHead>
                  <TableHead className="text-right text-sm">Maturity</TableHead>
                  <TableHead className="text-right text-sm">Annual Income</TableHead>
                  <TableHead className="text-right text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eurobonds.map((bond) => {
                  const faceValue = Number(bond.faceValue);
                  const purchasePrice = Number(bond.purchasePrice);
                  const couponRate = Number(bond.couponRate) * 100;
                  const annualIncome = faceValue * Number(bond.couponRate);
                  const maturityDate = new Date(bond.maturityDate);
                  const yearsToMaturity = ((maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);

                  return (
                    <TableRow key={bond.id}>
                      <TableCell className="font-medium">{bond.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{bond.isin || "-"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(faceValue, bond.currency)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(purchasePrice, bond.currency)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="tabular-nums">{formatPercent(couponRate)}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <div className="flex items-center justify-end gap-1 tabular-nums">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{formatDate(bond.maturityDate)}</span>
                          <span className="text-muted-foreground text-xs">({yearsToMaturity} yrs)</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-green-600 tabular-nums">
                        {formatCurrency(annualIncome, bond.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingEurobond(bond)}
                            title="Edit"
                            aria-label="Edit eurobond"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingEurobond(bond)}
                            title="Delete"
                            aria-label="Delete eurobond"
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
              title="No eurobonds added yet"
              action={
                <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Add Your First Eurobond
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Add Eurobond Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Eurobond</DialogTitle>
            <DialogDescription>
              Manually enter eurobond details
            </DialogDescription>
          </DialogHeader>
          <AddEurobondForm
            onSuccess={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Eurobond Dialog */}
      <Dialog open={!!editingEurobond} onOpenChange={(open) => !open && setEditingEurobond(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Eurobond</DialogTitle>
            <DialogDescription>
              Update your eurobond details
            </DialogDescription>
          </DialogHeader>
          {editingEurobond && (
            <EditEurobondForm
              eurobond={editingEurobond}
              onSuccess={() => setEditingEurobond(null)}
              onCancel={() => setEditingEurobond(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEurobond} onOpenChange={(open) => !open && setDeletingEurobond(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Eurobond</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingEurobond && (
                <>
                  Are you sure you want to delete <strong>{deletingEurobond.name}</strong>?
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

      {/* Upcoming Coupons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Coupon Payments</CardTitle>
          <CardDescription className="text-sm">Received coupon payments</CardDescription>
        </CardHeader>
        <CardContent>
          {eurobonds.some(b => b.couponPayments && b.couponPayments.length > 0) ? (
            <div className="space-y-4">
              {eurobonds.flatMap(bond =>
                (bond.couponPayments || []).map(payment => (
                  <CouponItem
                    key={payment.id}
                    bond={bond.name}
                    date={formatDate(payment.paymentDate)}
                    amount={formatCurrency(Number(payment.amount), payment.currency)}
                  />
                ))
              ).slice(0, 5)}
            </div>
          ) : (
            <p className="text-sm sm:text-base text-muted-foreground text-center py-4">No coupon payments yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CouponItem({ bond, date, amount }: { bond: string; date: string; amount: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div>
        <p className="font-medium">{bond}</p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <span className="font-medium text-green-600 tabular-nums">{amount}</span>
    </div>
  );
}
