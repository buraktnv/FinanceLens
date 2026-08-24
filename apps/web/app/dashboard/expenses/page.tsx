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
import { Plus, Repeat, Loader2, Pencil, Trash2, TrendingDown, Layers } from "lucide-react";
import { toast } from "sonner";
import { expensesApi, Expense } from "@/lib/api";
import { AddExpenseForm } from "@/components/forms/add-expense-form";
import { EditExpenseForm } from "@/components/forms/edit-expense-form";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
  TableSkeleton,
} from "@/components/shared";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

const expenseCategories: Record<string, { label: string; color: string }> = {
  RENT: { label: "Rent", color: "bg-red-500/15 text-red-600 dark:text-red-400" },
  MORTGAGE_PAYMENT: { label: "Mortgage", color: "bg-red-500/15 text-red-600 dark:text-red-400" },
  UTILITIES: { label: "Utilities", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  INTERNET: { label: "Internet", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  PHONE: { label: "Phone", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  MAINTENANCE: { label: "Maintenance", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  INSURANCE: { label: "Insurance", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  HOA_FEE: { label: "HOA Fee", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  PROPERTY_TAX: { label: "Property Tax", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  GROCERIES: { label: "Groceries", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  TRANSPORTATION: { label: "Transportation", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  FUEL: { label: "Fuel", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  CAR_PAYMENT: { label: "Car Payment", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  CAR_INSURANCE: { label: "Car Insurance", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  CAR_MAINTENANCE: { label: "Car Maintenance", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  PARKING: { label: "Parking", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  DINING: { label: "Dining", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  COFFEE: { label: "Coffee", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  ENTERTAINMENT: { label: "Entertainment", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
  HEALTHCARE: { label: "Healthcare", color: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
  EDUCATION: { label: "Education", color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  SHOPPING: { label: "Shopping", color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  CLOTHING: { label: "Clothing", color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  PERSONAL_CARE: { label: "Personal Care", color: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
  GYM: { label: "Gym", color: "bg-lime-500/15 text-lime-600 dark:text-lime-400" },
  SUBSCRIPTIONS: { label: "Subscriptions", color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" },
  TRAVEL: { label: "Travel", color: "bg-teal-500/15 text-teal-600 dark:text-teal-400" },
  GIFTS: { label: "Gifts", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  DONATIONS: { label: "Donations", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  TAXES: { label: "Taxes", color: "bg-slate-500/15 text-slate-600 dark:text-slate-400" },
  FEES: { label: "Fees", color: "bg-slate-500/15 text-slate-600 dark:text-slate-400" },
  OTHER: { label: "Other", color: "bg-muted text-muted-foreground" },
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Cash",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  BANK_TRANSFER: "Bank Transfer",
  MOBILE_PAYMENT: "Mobile Payment",
  CRYPTO: "Crypto",
  OTHER: "Other",
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

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // API expects 1-based month
  const currentYear = now.getFullYear();
  const {
    data: expenses = [],
    isLoading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => expensesApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["expenses", "summary", currentYear, currentMonth],
    queryFn: () => expensesApi.getSummary(currentMonth, currentYear),
  });

  const isLoading = expensesLoading || summaryLoading;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      toast.success("Expense deleted successfully");
      setDeletingExpense(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
      setDeletingExpense(null);
    },
  });

  const handleDelete = () => {
    if (deletingExpense) {
      deleteMutation.mutate(deletingExpense.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-36 sm:h-9" />
            <Skeleton className="h-4 w-40" />
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

  if (expensesError) {
    return (
      <ErrorState
        message={
          expensesError instanceof Error ? expensesError.message : undefined
        }
        onRetry={() => refetchExpenses()}
      />
    );
  }

  const totalThisMonth = summary?.total ?? 0;
  const totalRecurring = summary?.recurring ?? 0;
  const expenseCount = summary?.count ?? expenses.length;
  const byCategory = summary?.byCategory ?? {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Expenses"
        description="Track your spending"
        actions={
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Add New Expense
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <StatCard
          title="This Month Total"
          value={formatCurrency(totalThisMonth)}
          icon={TrendingDown}
          tone="danger"
        />
        <StatCard
          title="Fixed Expenses"
          value={formatCurrency(totalRecurring)}
          hint="Monthly recurring"
          icon={Repeat}
        />
        <StatCard
          title="Transaction Count"
          value={expenseCount}
          hint="This month"
          icon={Layers}
        />
      </div>

      {/* Expense Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Expense Distribution</CardTitle>
          <CardDescription className="text-sm">Where is your money going?</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(byCategory).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const categoryInfo = expenseCategories[category] ?? expenseCategories.OTHER!;
                  const pct = totalThisMonth > 0 ? (amount / totalThisMonth) * 100 : 0;
                  return (
                    <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={categoryInfo!.color}>{categoryInfo!.label}</Badge>
                            <span className="text-sm text-muted-foreground tabular-nums">{formatPercent(pct)}</span>
                          </div>
                          <span className="font-medium text-sm sm:text-base tabular-nums">{formatCurrency(amount)}</span>
                        </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <EmptyState title="No expense data yet" />
          )}
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Expense List</CardTitle>
          <CardDescription className="text-sm">All your expenses</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {expenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Category</TableHead>
                  <TableHead className="text-sm">Description</TableHead>
                  <TableHead className="text-right text-sm">Amount</TableHead>
                  <TableHead className="text-sm">Date</TableHead>
                  <TableHead className="text-sm">Payment</TableHead>
                  <TableHead className="text-sm">Recurring</TableHead>
                  <TableHead className="text-right text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => {
                  const categoryInfo = expenseCategories[expense.category] ?? expenseCategories.OTHER!;
                  const amount = Number(expense.amount);
                  return (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <Badge className={categoryInfo!.color}>{categoryInfo!.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{expense.description || "-"}</TableCell>
                      <TableCell className="text-right font-medium text-sm text-red-600 tabular-nums">
                        -{formatCurrency(amount, expense.currency)}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        {expense.paymentMethod ? (
                          <Badge variant="outline">
                            {paymentMethodLabels[expense.paymentMethod] || expense.paymentMethod}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {expense.isRecurring && expense.frequency ? (
                          <Badge variant="outline" className="gap-1">
                            <Repeat className="h-3 w-3" />
                            {frequencyLabels[expense.frequency] || expense.frequency}
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
                            onClick={() => setEditingExpense(expense)}
                            title="Edit"
                            aria-label="Edit expense"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingExpense(expense)}
                            title="Delete"
                            aria-label="Delete expense"
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
              title="No expenses added yet"
              action={
                <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Add Your First Expense
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Enter your expense details
            </DialogDescription>
          </DialogHeader>
          <AddExpenseForm
            onSuccess={() => {
              toast.success("Expense added successfully");
              setShowAddDialog(false);
            }}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update your expense details
            </DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <EditExpenseForm
              expense={editingExpense}
              onSuccess={() => setEditingExpense(null)}
              onCancel={() => setEditingExpense(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This expense will be permanently deleted.
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
