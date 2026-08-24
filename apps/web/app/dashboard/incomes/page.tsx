"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Repeat, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { incomesApi, Income } from "@/lib/api";
import { AddIncomeForm } from "@/components/forms/add-income-form";
import { EditIncomeForm } from "@/components/forms/edit-income-form";
import { formatCurrency, formatDate } from "@/lib/format";

const incomeTypes: Record<string, { label: string; color: string }> = {
  SALARY: { label: "Salary", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  RENTAL: { label: "Rental", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  DIVIDEND: { label: "Dividend", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
  INTEREST: { label: "Interest", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  FREELANCE: { label: "Freelance", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  BONUS: { label: "Bonus", color: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
  GIFT: { label: "Gift", color: "bg-teal-500/15 text-teal-600 dark:text-teal-400" },
  REFUND: { label: "Refund", color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" },
  SALE: { label: "Sale", color: "bg-lime-500/15 text-lime-600 dark:text-lime-400" },
  OTHER: { label: "Other", color: "bg-muted text-muted-foreground" },
};

const frequencyLabels: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  SEMIANNUAL: "Semiannual",
  ANNUAL: "Annual",
};

export default function IncomesPage() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deletingIncome, setDeletingIncome] = useState<Income | null>(null);
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // API expects 1-based month
  const currentYear = now.getFullYear();
  const { data: incomes = [], isLoading: incomesLoading, error: incomesError } = useQuery({
    queryKey: ["incomes"],
    queryFn: () => incomesApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["incomes", "summary", currentYear, currentMonth],
    queryFn: () => incomesApi.getSummary(currentMonth, currentYear),
  });

  const isLoading = incomesLoading || summaryLoading;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => incomesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["incomes", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      toast.success("Income deleted successfully");
      setDeletingIncome(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
      setDeletingIncome(null);
    },
  });

  const handleDelete = () => {
    if (deletingIncome) {
      deleteMutation.mutate(deletingIncome.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (incomesError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">
          {incomesError instanceof Error ? incomesError.message : "Error loading data"}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const totalThisMonth = summary?.total ?? 0;
  const totalRecurring = summary?.recurring ?? 0;
  const incomeCount = summary?.count ?? incomes.length;
  const byType = summary?.byType ?? {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Incomes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track your income sources</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          Add New Income
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(totalThisMonth)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recurring Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalRecurring)}</div>
            <p className="text-xs text-muted-foreground">Monthly recurring</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Income Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{incomeCount}</div>
            <p className="text-xs text-muted-foreground">Active sources</p>
          </CardContent>
        </Card>
      </div>

      {/* Income by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Income Distribution</CardTitle>
          <CardDescription className="text-sm">Distribution by income type</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(byType).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(byType).map(([type, amount]) => (
                <IncomeTypeCard key={type} type={type} amount={amount} />
              ))}
            </div>
          ) : (
            <p className="text-sm sm:text-base text-muted-foreground text-center py-4">No income data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Incomes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Income List</CardTitle>
          <CardDescription className="text-sm">All your incomes</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {incomes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Type</TableHead>
                  <TableHead className="text-sm">Description</TableHead>
                  <TableHead className="text-right text-sm">Amount</TableHead>
                  <TableHead className="text-sm">Date</TableHead>
                  <TableHead className="text-sm">Recurring</TableHead>
                  <TableHead className="text-right text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((income) => {
                  const typeInfo = incomeTypes[income.type] ?? incomeTypes.OTHER!;
                  const amount = Number(income.amount);
                  return (
                    <TableRow key={income.id}>
                      <TableCell>
                        <Badge className={typeInfo!.color}>{typeInfo!.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{income.description || "-"}</TableCell>
                      <TableCell className="text-right font-medium text-sm text-green-600">
                        +{formatCurrency(amount, income.currency)}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(income.date)}</TableCell>
                      <TableCell>
                        {income.isRecurring && income.frequency ? (
                          <Badge variant="outline" className="gap-1">
                            <Repeat className="h-3 w-3" />
                            {frequencyLabels[income.frequency] || income.frequency}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingIncome(income)}
                            title="Edit"
                            aria-label="Edit income"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingIncome(income)}
                            title="Delete"
                            aria-label="Delete income"
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
            <div className="text-center py-8">
              <p className="text-sm sm:text-base text-muted-foreground">No incomes added yet</p>
              <Button className="mt-4 gap-2" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4" />
                Add Your First Income
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Income Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Income</DialogTitle>
            <DialogDescription>
              Enter your income details
            </DialogDescription>
          </DialogHeader>
          <AddIncomeForm
            onSuccess={() => {
              toast.success("Income added successfully");
              setShowAddDialog(false);
            }}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingIncome} onOpenChange={(open) => !open && setEditingIncome(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Income</DialogTitle>
            <DialogDescription>
              Update your income details
            </DialogDescription>
          </DialogHeader>
          {editingIncome && (
            <EditIncomeForm
              income={editingIncome}
              onSuccess={() => setEditingIncome(null)}
              onCancel={() => setEditingIncome(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingIncome} onOpenChange={(open) => !open && setDeletingIncome(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This income will be permanently deleted.
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

function IncomeTypeCard({ type, amount }: { type: string; amount: number }) {
  const typeInfo = incomeTypes[type] ?? incomeTypes.OTHER!;
  return (
    <div className="p-4 bg-muted/30 rounded-lg text-center">
      <Badge className={typeInfo!.color}>{typeInfo!.label}</Badge>
      <p className="text-lg sm:text-xl font-bold mt-2">{formatCurrency(amount)}</p>
    </div>
  );
}
