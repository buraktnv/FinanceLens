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
import { Plus, Search, Loader2, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { goldApi, preciousMetalsApi, Gold } from "@/lib/api";
import { AddGoldForm } from "@/components/forms/add-gold-form";
import { EditGoldForm } from "@/components/forms/edit-gold-form";
import { toast } from "sonner";

export default function GoldPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGold, setEditingGold] = useState<Gold | null>(null);
  const [deletingGold, setDeletingGold] = useState<Gold | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { data: holdings = [], isLoading: holdingsLoading, error: holdingsError } = useQuery({
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
  });

  // Fetch current gold price every 15 minutes
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const priceData = await preciousMetalsApi.getGoldPrice();
        setCurrentPrice(priceData.pricePerGram);
        setLastUpdated(new Date());
      } catch {
        // Price fetch failed — keep last known price
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []);

  const filteredHoldings = holdings.filter((gold) =>
    gold.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number, decimals = 2) => {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  const handleDelete = () => {
    if (deletingGold) {
      deleteMutation.mutate(deletingGold.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (holdingsError) {
    return (
      <div className="text-center text-red-600 py-8">
        Error: {holdingsError instanceof Error ? holdingsError.message : "Unknown error"}
      </div>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gold Portfolio</h1>
          <p className="text-sm sm:text-base text-muted-foreground">All your gold assets</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add New Gold
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Grams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalQuantity.toFixed(3)} g</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(currentValue)}</div>
            {currentPrice && (
              <p className="text-xs text-muted-foreground mt-1">
                ${currentPrice.toFixed(3)}/gram
                {lastUpdated && (
                  <span className="ml-2">
                    (Updated: {lastUpdated.toLocaleTimeString("en-US")})
                  </span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold flex items-center ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitLoss >= 0 ? <TrendingUp className="mr-1 h-5 w-5" /> : <TrendingDown className="mr-1 h-5 w-5" />}
              {formatCurrency(Math.abs(profitLoss))}
            </div>
            <p className={`text-sm ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitLoss >= 0 ? '+' : '-'}{Math.abs(profitLossPercent).toFixed(2)}%
            </p>
          </CardContent>
        </Card>
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
            <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
              No gold added yet.
            </div>
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
                      <TableCell className="text-right">{quantity.toFixed(3)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(purchasePrice, 3)}</TableCell>
                      <TableCell className="text-right">
                        {currentPrice ? formatCurrency(currentPrice, 3) : "-"}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(current)}</TableCell>
                      <TableCell className="text-right">
                        {currentPrice ? (
                          <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(profit)} ({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%)
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
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingGold(gold)}
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
