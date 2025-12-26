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
      } catch (error) {
        console.error("Failed to fetch gold price:", error);
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
    return `₺${value.toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
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
      <div className="text-center text-red-600">
        Hata: {holdingsError instanceof Error ? holdingsError.message : "Bilinmeyen hata"}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Altin Portfoyu</h1>
          <p className="text-muted-foreground">Tum altin varliklariniz</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Altin Ekle
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gram</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toFixed(3)} g</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Maliyet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Guncel Deger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentValue)}</div>
            {currentPrice && (
              <p className="text-xs text-muted-foreground mt-1">
                ₺{currentPrice.toFixed(3)}/gram
                {lastUpdated && (
                  <span className="ml-2">
                    (Guncelleme: {lastUpdated.toLocaleTimeString("tr-TR")})
                  </span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kar/Zarar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Altin ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Gold Table */}
      <Card>
        <CardHeader>
          <CardTitle>Altin Portfoyu</CardTitle>
          <CardDescription>Tum altin varliklariniz</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHoldings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henuz altin eklenmemis.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Altin Adi</TableHead>
                  <TableHead className="text-right">Gram</TableHead>
                  <TableHead className="text-right">Alis Fiyati</TableHead>
                  <TableHead className="text-right">Guncel Fiyat</TableHead>
                  <TableHead className="text-right">Guncel Deger</TableHead>
                  <TableHead className="text-right">Kar/Zarar</TableHead>
                  <TableHead>Ayar</TableHead>
                  <TableHead className="text-right">Islemler</TableHead>
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
                      <TableCell>{gold.purity || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingGold(gold)}
                            title="Duzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingGold(gold)}
                            title="Sil"
                            className="text-red-600 hover:text-red-700"
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
            <DialogTitle>Yeni Altin Ekle</DialogTitle>
            <DialogDescription>
              Altin varligi bilgilerini girin
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
            <DialogTitle>Altin Duzenle</DialogTitle>
            <DialogDescription>
              Altin varligi bilgilerini guncelleyin
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
            <AlertDialogTitle>Altini Sil?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu islemi geri alamazsiniz. Altin kalici olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
