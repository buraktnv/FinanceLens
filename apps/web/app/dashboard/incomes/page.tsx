"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Repeat, Loader2 } from "lucide-react";
import { incomesApi } from "@/lib/api";
import { AddIncomeForm } from "@/components/forms/add-income-form";

const incomeTypes: Record<string, { label: string; color: string }> = {
  SALARY: { label: "Maas", color: "bg-blue-100 text-blue-800" },
  RENTAL: { label: "Kira", color: "bg-green-100 text-green-800" },
  DIVIDEND: { label: "Temettu", color: "bg-purple-100 text-purple-800" },
  INTEREST: { label: "Faiz", color: "bg-yellow-100 text-yellow-800" },
  FREELANCE: { label: "Serbest", color: "bg-orange-100 text-orange-800" },
  BONUS: { label: "Prim", color: "bg-pink-100 text-pink-800" },
  GIFT: { label: "Hediye", color: "bg-teal-100 text-teal-800" },
  REFUND: { label: "Iade", color: "bg-cyan-100 text-cyan-800" },
  SALE: { label: "Satis", color: "bg-lime-100 text-lime-800" },
  OTHER: { label: "Diger", color: "bg-gray-100 text-gray-800" },
};

const frequencyLabels: Record<string, string> = {
  DAILY: "Gunluk",
  WEEKLY: "Haftalik",
  BIWEEKLY: "2 Haftalik",
  MONTHLY: "Aylik",
  QUARTERLY: "3 Aylik",
  SEMIANNUAL: "6 Aylik",
  ANNUAL: "Yillik",
};

export default function IncomesPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { data: incomes = [], isLoading: incomesLoading, error: incomesError } = useQuery({
    queryKey: ["incomes"],
    queryFn: () => incomesApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["incomes", "summary"],
    queryFn: () => incomesApi.getSummary(),
  });

  const isLoading = incomesLoading || summaryLoading;

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
          {incomesError instanceof Error ? incomesError.message : "Veri yuklenirken hata olustu"}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tekrar Dene
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gelirler</h1>
          <p className="text-muted-foreground">Gelirlerinizi takip edin</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          Yeni Gelir Ekle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bu Ay Toplam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₺{totalThisMonth.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duzenli Gelir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{totalRecurring.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Aylik tekrarlayan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gelir Kaynaklari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incomeCount}</div>
            <p className="text-xs text-muted-foreground">Aktif kaynak</p>
          </CardContent>
        </Card>
      </div>

      {/* Income by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Gelir Dagilimi</CardTitle>
          <CardDescription>Gelir turlerine gore dagilim</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(byType).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(byType).map(([type, amount]) => (
                <IncomeTypeCard key={type} type={type} amount={amount} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Henuz gelir verisi yok</p>
          )}
        </CardContent>
      </Card>

      {/* Incomes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gelir Listesi</CardTitle>
          <CardDescription>Tum gelirleriniz</CardDescription>
        </CardHeader>
        <CardContent>
          {incomes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tur</TableHead>
                  <TableHead>Aciklama</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tekrar</TableHead>
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
                      <TableCell>{income.description || "-"}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        +₺{amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{new Date(income.date).toLocaleDateString("tr-TR")}</TableCell>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henuz gelir eklenmedi</p>
              <Button className="mt-4 gap-2" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4" />
                Ilk Gelirinizi Ekleyin
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Income Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Gelir Ekle</DialogTitle>
            <DialogDescription>
              Gelir bilgilerinizi girin
            </DialogDescription>
          </DialogHeader>
          <AddIncomeForm
            onSuccess={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IncomeTypeCard({ type, amount }: { type: string; amount: number }) {
  const typeInfo = incomeTypes[type] ?? incomeTypes.OTHER!;
  return (
    <div className="p-4 bg-gray-50 rounded-lg text-center">
      <Badge className={typeInfo!.color}>{typeInfo!.label}</Badge>
      <p className="text-xl font-bold mt-2">₺{Number(amount).toLocaleString()}</p>
    </div>
  );
}
