"use client";

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
import { Badge } from "@/components/ui/badge";
import { Plus, Repeat, Loader2 } from "lucide-react";
import { expensesApi } from "@/lib/api";

const expenseCategories: Record<string, { label: string; color: string }> = {
  RENT: { label: "Kira", color: "bg-red-100 text-red-800" },
  MORTGAGE_PAYMENT: { label: "Mortgage", color: "bg-red-100 text-red-800" },
  UTILITIES: { label: "Faturalar", color: "bg-orange-100 text-orange-800" },
  INTERNET: { label: "Internet", color: "bg-orange-100 text-orange-800" },
  PHONE: { label: "Telefon", color: "bg-orange-100 text-orange-800" },
  MAINTENANCE: { label: "Bakim", color: "bg-orange-100 text-orange-800" },
  INSURANCE: { label: "Sigorta", color: "bg-orange-100 text-orange-800" },
  HOA_FEE: { label: "Aidat", color: "bg-orange-100 text-orange-800" },
  PROPERTY_TAX: { label: "Emlak Vergisi", color: "bg-orange-100 text-orange-800" },
  GROCERIES: { label: "Market", color: "bg-green-100 text-green-800" },
  TRANSPORTATION: { label: "Ulasim", color: "bg-blue-100 text-blue-800" },
  FUEL: { label: "Yakit", color: "bg-blue-100 text-blue-800" },
  CAR_PAYMENT: { label: "Arac Taksit", color: "bg-blue-100 text-blue-800" },
  CAR_INSURANCE: { label: "Arac Sigorta", color: "bg-blue-100 text-blue-800" },
  CAR_MAINTENANCE: { label: "Arac Bakim", color: "bg-blue-100 text-blue-800" },
  PARKING: { label: "Otopark", color: "bg-blue-100 text-blue-800" },
  DINING: { label: "Yemek", color: "bg-yellow-100 text-yellow-800" },
  COFFEE: { label: "Kahve", color: "bg-yellow-100 text-yellow-800" },
  ENTERTAINMENT: { label: "Eglence", color: "bg-purple-100 text-purple-800" },
  HEALTHCARE: { label: "Saglik", color: "bg-pink-100 text-pink-800" },
  EDUCATION: { label: "Egitim", color: "bg-indigo-100 text-indigo-800" },
  SHOPPING: { label: "Alisveris", color: "bg-indigo-100 text-indigo-800" },
  CLOTHING: { label: "Giyim", color: "bg-indigo-100 text-indigo-800" },
  PERSONAL_CARE: { label: "Kisisel Bakim", color: "bg-pink-100 text-pink-800" },
  GYM: { label: "Spor", color: "bg-lime-100 text-lime-800" },
  SUBSCRIPTIONS: { label: "Abonelik", color: "bg-cyan-100 text-cyan-800" },
  TRAVEL: { label: "Seyahat", color: "bg-teal-100 text-teal-800" },
  GIFTS: { label: "Hediye", color: "bg-rose-100 text-rose-800" },
  DONATIONS: { label: "Bagis", color: "bg-rose-100 text-rose-800" },
  TAXES: { label: "Vergi", color: "bg-slate-100 text-slate-800" },
  FEES: { label: "Ucret", color: "bg-slate-100 text-slate-800" },
  OTHER: { label: "Diger", color: "bg-gray-100 text-gray-800" },
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Nakit",
  CREDIT_CARD: "Kredi Karti",
  DEBIT_CARD: "Banka Karti",
  BANK_TRANSFER: "Havale",
  MOBILE_PAYMENT: "Mobil Odeme",
  CRYPTO: "Kripto",
  OTHER: "Diger",
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

export default function ExpensesPage() {
  const { data: expenses = [], isLoading: expensesLoading, error: expensesError } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => expensesApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["expenses", "summary"],
    queryFn: () => expensesApi.getSummary(),
  });

  const isLoading = expensesLoading || summaryLoading;

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
          {expensesError instanceof Error ? expensesError.message : "Veri yuklenirken hata olustu"}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tekrar Dene
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Giderler</h1>
          <p className="text-muted-foreground">Harcamalarinizi takip edin</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Gider Ekle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bu Ay Toplam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₺{totalThisMonth.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sabit Giderler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{totalRecurring.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Aylik tekrarlayan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Islem Sayisi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenseCount}</div>
            <p className="text-xs text-muted-foreground">Bu ay</p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Harcama Dagilimi</CardTitle>
          <CardDescription>Paraniz nereye gidiyor?</CardDescription>
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
                        <span className="font-medium">₺{Number(amount).toLocaleString()}</span>
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
            <p className="text-muted-foreground text-center py-4">Henuz harcama verisi yok</p>
          )}
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gider Listesi</CardTitle>
          <CardDescription>Tum harcamalariniz</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Aciklama</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Odeme</TableHead>
                  <TableHead>Tekrar</TableHead>
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
                      <TableCell>{expense.description || "-"}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        -₺{amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{new Date(expense.date).toLocaleDateString("tr-TR")}</TableCell>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henuz gider eklenmedi</p>
              <Button className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Ilk Giderinizi Ekleyin
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
