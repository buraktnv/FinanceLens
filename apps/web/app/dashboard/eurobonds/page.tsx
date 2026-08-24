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
import { Plus, Calendar, Loader2, Pencil, Trash2 } from "lucide-react";
import { eurobondsApi, Eurobond } from "@/lib/api";
import { AddEurobondForm } from "@/components/forms/add-eurobond-form";
import { EditEurobondForm } from "@/components/forms/edit-eurobond-form";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";

export default function EurobondsPage() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEurobond, setEditingEurobond] = useState<Eurobond | null>(null);
  const [deletingEurobond, setDeletingEurobond] = useState<Eurobond | null>(null);
  const { data: eurobonds = [], isLoading: bondsLoading, error: bondsError } = useQuery({
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (bondsError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">
          {bondsError instanceof Error ? bondsError.message : "Error loading data"}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const totalFaceValue = summary?.totalFaceValue ?? 0;
  const totalCurrentValue = summary?.totalCurrentValue ?? 0;
  const annualCouponIncome = summary?.annualCouponIncome ?? 0;
  const avgYield = totalFaceValue > 0 ? (annualCouponIncome / totalFaceValue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Eurobonds</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your eurobond portfolio</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          Add New Eurobond
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Face Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalFaceValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalCurrentValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Annual Coupon Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(annualCouponIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatPercent(avgYield)}</div>
          </CardContent>
        </Card>
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
                      <TableCell className="text-right">{formatCurrency(faceValue, bond.currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(purchasePrice, bond.currency)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{formatPercent(couponRate)}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{formatDate(bond.maturityDate)}</span>
                          <span className="text-muted-foreground text-xs">({yearsToMaturity} yrs)</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-green-600">
                        {formatCurrency(annualIncome, bond.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingEurobond(bond)}
                            title="Edit"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingEurobond(bond)}
                            title="Delete"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
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
              <p className="text-sm sm:text-base text-muted-foreground">No eurobonds added yet</p>
              <Button className="mt-4 gap-2" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4" />
                Add Your First Eurobond
              </Button>
            </div>
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
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium">{bond}</p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <span className="font-medium text-green-600">{amount}</span>
    </div>
  );
}
