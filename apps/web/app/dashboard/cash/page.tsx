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
import { Plus, Search, Loader2, Pencil, Trash2, Wallet } from "lucide-react";
import { cashApi, Cash } from "@/lib/api";
import { AddCashForm } from "@/components/forms/add-cash-form";
import { EditCashForm } from "@/components/forms/edit-cash-form";

export default function CashPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCash, setEditingCash] = useState<Cash | null>(null);
  const [deletingCash, setDeletingCash] = useState<Cash | null>(null);

  const { data: cashAccounts = [], isLoading: cashLoading, error: cashError } = useQuery({
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
      setDeletingCash(null);
    },
  });

  const filteredCash = cashAccounts.filter(
    (cash) =>
      cash.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cash.bankName && cash.bankName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (value: number, currency = "TRY") => {
    const symbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency;
    return `${symbol}${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleDelete = () => {
    if (deletingCash) {
      deleteMutation.mutate(deletingCash.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (cashError) {
    return (
      <div className="text-center text-red-600">
        Hata: {cashError instanceof Error ? cashError.message : "Bilinmeyen hata"}
      </div>
    );
  }

  const totalBalance = summary?.totalBalance || 0;
  const totalAccounts = summary?.totalAccounts || 0;
  const byCurrency = summary?.byCurrency || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nakit Hesaplari</h1>
          <p className="text-muted-foreground">Tum nakit hesaplariniz</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Hesap Ekle
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Hesap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAccounts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Bakiye (TRY)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{totalBalance.toLocaleString("tr-TR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Para Birimleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {Object.entries(byCurrency).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between">
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
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Hesap ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Cash Table */}
      <Card>
        <CardHeader>
          <CardTitle>Nakit Hesaplari</CardTitle>
          <CardDescription>Tum nakit hesaplariniz</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCash.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henuz nakit hesabi eklenmemis.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hesap Adi</TableHead>
                  <TableHead>Banka</TableHead>
                  <TableHead className="text-right">Bakiye</TableHead>
                  <TableHead>Para Birimi</TableHead>
                  <TableHead>Hesap Turu</TableHead>
                  <TableHead className="text-right">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCash.map((cash) => (
                  <TableRow key={cash.id}>
                    <TableCell className="font-medium">{cash.accountName}</TableCell>
                    <TableCell>{cash.bankName || "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cash.balance, cash.currency)}</TableCell>
                    <TableCell>{cash.currency}</TableCell>
                    <TableCell>{cash.accountType || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCash(cash)}
                          title="Duzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingCash(cash)}
                          title="Sil"
                          className="text-red-600 hover:text-red-700"
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
            <DialogTitle>Yeni Nakit Hesabi Ekle</DialogTitle>
            <DialogDescription>
              Nakit hesap bilgilerini girin
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
            <DialogTitle>Nakit Hesabi Duzenle</DialogTitle>
            <DialogDescription>
              Nakit hesap bilgilerini guncelleyin
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
            <AlertDialogTitle>Hesabi Sil?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu islemi geri alamazsiniz. Hesap kalici olarak silinecektir.
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
