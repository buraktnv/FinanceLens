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
import { Plus, Repeat } from "lucide-react";

const expenseCategories: Record<string, { label: string; color: string }> = {
  RENT: { label: "Kira", color: "bg-red-100 text-red-800" },
  UTILITIES: { label: "Faturalar", color: "bg-orange-100 text-orange-800" },
  GROCERIES: { label: "Market", color: "bg-green-100 text-green-800" },
  TRANSPORTATION: { label: "Ulasim", color: "bg-blue-100 text-blue-800" },
  DINING: { label: "Yemek", color: "bg-yellow-100 text-yellow-800" },
  ENTERTAINMENT: { label: "Eglence", color: "bg-purple-100 text-purple-800" },
  HEALTHCARE: { label: "Saglik", color: "bg-pink-100 text-pink-800" },
  SHOPPING: { label: "Alisveris", color: "bg-indigo-100 text-indigo-800" },
  SUBSCRIPTIONS: { label: "Abonelik", color: "bg-cyan-100 text-cyan-800" },
  OTHER: { label: "Diger", color: "bg-gray-100 text-gray-800" },
};

const mockExpenses = [
  { id: 1, category: "RENT", description: "Ev Kirasi", amount: 12000, currency: "TRY", date: "2024-01-05", isRecurring: true, paymentMethod: "BANK_TRANSFER" },
  { id: 2, category: "UTILITIES", description: "Elektrik Faturasi", amount: 850, currency: "TRY", date: "2024-01-10", isRecurring: true, paymentMethod: "CREDIT_CARD" },
  { id: 3, category: "UTILITIES", description: "Dogalgaz Faturasi", amount: 1200, currency: "TRY", date: "2024-01-12", isRecurring: true, paymentMethod: "CREDIT_CARD" },
  { id: 4, category: "GROCERIES", description: "Haftalik Market", amount: 2500, currency: "TRY", date: "2024-01-20", isRecurring: false, paymentMethod: "CREDIT_CARD" },
  { id: 5, category: "TRANSPORTATION", description: "Akbil Yukleme", amount: 500, currency: "TRY", date: "2024-01-15", isRecurring: false, paymentMethod: "CASH" },
  { id: 6, category: "DINING", description: "Restoran", amount: 750, currency: "TRY", date: "2024-01-18", isRecurring: false, paymentMethod: "CREDIT_CARD" },
  { id: 7, category: "SUBSCRIPTIONS", description: "Netflix + Spotify", amount: 250, currency: "TRY", date: "2024-01-01", isRecurring: true, paymentMethod: "CREDIT_CARD" },
  { id: 8, category: "HEALTHCARE", description: "Eczane", amount: 320, currency: "TRY", date: "2024-01-22", isRecurring: false, paymentMethod: "CASH" },
];

export default function ExpensesPage() {
  const totalThisMonth = mockExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRecurring = mockExpenses.filter(e => e.isRecurring).reduce((sum, e) => sum + e.amount, 0);

  // Calculate by category
  const byCategory = mockExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

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
            <div className="text-2xl font-bold">{mockExpenses.length}</div>
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
          <div className="space-y-4">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const categoryInfo = expenseCategories[category] || expenseCategories.OTHER;
                const percentage = ((amount / totalThisMonth) * 100).toFixed(1);
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                      </div>
                      <span className="font-medium">₺{amount.toLocaleString()}</span>
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
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gider Listesi</CardTitle>
          <CardDescription>Tum harcamalariniz</CardDescription>
        </CardHeader>
        <CardContent>
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
              {mockExpenses.map((expense) => {
                const categoryInfo = expenseCategories[expense.category] || expenseCategories.OTHER;
                return (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      -₺{expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {expense.paymentMethod === "CREDIT_CARD" ? "Kredi Karti" :
                          expense.paymentMethod === "CASH" ? "Nakit" : "Havale"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {expense.isRecurring ? (
                        <Badge variant="outline" className="gap-1">
                          <Repeat className="h-3 w-3" />
                          Aylik
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
        </CardContent>
      </Card>
    </div>
  );
}
