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
import { expensesApi, Expense } from "@/lib/api";
import { AddExpenseForm } from "@/components/forms/add-expense-form";
import { EditExpenseForm } from "@/components/forms/edit-expense-form";

const expenseCategories: Record<string, { label: string; color: string }> = {
  RENT: { label: "Rent", color: "bg-red-100 text-red-800" },
  MORTGAGE_PAYMENT: { label: "Mortgage", color: "bg-red-100 text-red-800" },
  UTILITIES: { label: "Utilities", color: "bg-orange-100 text-orange-800" },
  INTERNET: { label: "Internet", color: "bg-orange-100 text-orange-800" },
  PHONE: { label: "Phone", color: "bg-orange-100 text-orange-800" },
  MAINTENANCE: { label: "Maintenance", color: "bg-orange-100 text-orange-800" },
  INSURANCE: { label: "Insurance", color: "bg-orange-100 text-orange-800" },
  HOA_FEE: { label: "HOA Fee", color: "bg-orange-100 text-orange-800" },
  PROPERTY_TAX: { label: "Property Tax", color: "bg-orange-100 text-orange-800" },
  GROCERIES: { label: "Groceries", color: "bg-green-100 text-green-800" },
  TRANSPORTATION: { label: "Transportation", color: "bg-blue-100 text-blue-800" },
  FUEL: { label: "Fuel", color: "bg-blue-100 text-blue-800" },
  CAR_PAYMENT: { label: "Car Payment", color: "bg-blue-100 text-blue-800" },
  CAR_INSURANCE: { label: "Car Insurance", color: "bg-blue-100 text-blue-800" },
  CAR_MAINTENANCE: { label: "Car Maintenance", color: "bg-blue-100 text-blue-800" },
  PARKING: { label: "Parking", color: "bg-blue-100 text-blue-800" },
  DINING: { label: "Dining", color: "bg-yellow-100 text-yellow-800" },
  COFFEE: { label: "Coffee", color: "bg-yellow-100 text-yellow-800" },
  ENTERTAINMENT: { label: "Entertainment", color: "bg-purple-100 text-purple-800" },
  HEALTHCARE: { label: "Healthcare", color: "bg-pink-100 text-pink-800" },
  EDUCATION: { label: "Education", color: "bg-indigo-100 text-indigo-800" },
  SHOPPING: { label: "Shopping", color: "bg-indigo-100 text-indigo-800" },
  CLOTHING: { label: "Clothing", color: "bg-indigo-100 text-indigo-800" },
  PERSONAL_CARE: { label: "Personal Care", color: "bg-pink-100 text-pink-800" },
  GYM: { label: "Gym", color: "bg-lime-100 text-lime-800" },
  SUBSCRIPTIONS: { label: "Subscriptions", color: "bg-cyan-100 text-cyan-800" },
  TRAVEL: { label: "Travel", color: "bg-teal-100 text-teal-800" },
  GIFTS: { label: "Gifts", color: "bg-rose-100 text-rose-800" },
  DONATIONS: { label: "Donations", color: "bg-rose-100 text-rose-800" },
  TAXES: { label: "Taxes", color: "bg-slate-100 text-slate-800" },
  FEES: { label: "Fees", color: "bg-slate-100 text-slate-800" },
  OTHER: { label: "Other", color: "bg-gray-100 text-gray-800" },
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
  const { data: expenses = [], isLoading: expensesLoading, error: expensesError } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => expensesApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["expenses", "summary"],
    queryFn: () => expensesApi.getSummary(),
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
  });

  const handleDelete = () => {
    if (deletingExpense) {
      deleteMutation.mutate(deletingExpense.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (expensesError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">
          {expensesError instanceof Error ? expensesError.message : "Error loading data"}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const totalThisMonth = summary?.total ?? 0;
  const totalRecurring = summary?.recurring ?? 0;
  const expenseCount = summary?.count ?? expenses.length;
  const byCategory = summary?.byCategory ?? {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Expenses</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track your spending</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          Add New Expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">${totalThisMonth.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fixed Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">${totalRecurring.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly recurring</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transaction Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{expenseCount}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
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
                  const percentage = totalThisMonth > 0 ? ((amount / totalThisMonth) * 100).toFixed(1) : "0";
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={categoryInfo!.color}>{categoryInfo!.label}</Badge>
                          <span className="text-sm text-muted-foreground">{percentage}%</span>
                        </div>
                        <span className="font-medium text-sm sm:text-base">${Number(amount).toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm sm:text-base text-muted-foreground text-center py-4">No expense data yet</p>
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
                      <TableCell className="text-right font-medium text-sm text-red-600">
                        -${amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">{new Date(expense.date).toLocaleDateString("en-US")}</TableCell>
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
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingExpense(expense)}
                            title="Delete"
                            className="text-red-600 hover:text-red-700 h-8 w-8"
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
              <p className="text-sm sm:text-base text-muted-foreground">No expenses added yet</p>
              <Button className="mt-4 gap-2" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4" />
                Add Your First Expense
              </Button>
            </div>
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
