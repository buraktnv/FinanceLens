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

const incomeTypes: Record<string, { label: string; color: string }> = {
  SALARY: { label: "Maas", color: "bg-blue-100 text-blue-800" },
  RENTAL: { label: "Kira", color: "bg-green-100 text-green-800" },
  DIVIDEND: { label: "Temettu", color: "bg-purple-100 text-purple-800" },
  INTEREST: { label: "Faiz", color: "bg-yellow-100 text-yellow-800" },
  FREELANCE: { label: "Serbest", color: "bg-orange-100 text-orange-800" },
  BONUS: { label: "Prim", color: "bg-pink-100 text-pink-800" },
  OTHER: { label: "Diger", color: "bg-gray-100 text-gray-800" },
};

const mockIncomes = [
  { id: 1, type: "SALARY", description: "Aylik Maas", amount: 45000, currency: "TRY", date: "2024-01-25", isRecurring: true, frequency: "MONTHLY" },
  { id: 2, type: "RENTAL", description: "Kadikoy Daire Kirasi", amount: 15000, currency: "TRY", date: "2024-01-05", isRecurring: true, frequency: "MONTHLY" },
  { id: 3, type: "DIVIDEND", description: "THYAO Temettu", amount: 2500, currency: "TRY", date: "2024-01-15", isRecurring: false },
  { id: 4, type: "INTEREST", description: "Mevduat Faizi", amount: 1200, currency: "TRY", date: "2024-01-20", isRecurring: true, frequency: "MONTHLY" },
  { id: 5, type: "FREELANCE", description: "Danismanlik Projesi", amount: 8000, currency: "TRY", date: "2024-01-10", isRecurring: false },
];

export default function IncomesPage() {
  const totalMonthly = mockIncomes.filter(i => i.isRecurring).reduce((sum, i) => sum + i.amount, 0);
  const totalThisMonth = mockIncomes.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gelirler</h1>
          <p className="text-muted-foreground">Gelirlerinizi takip edin</p>
        </div>
        <Button className="gap-2">
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
            <div className="text-2xl font-bold">₺{totalMonthly.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Aylik tekrarlayan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gelir Kaynaklari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockIncomes.length}</div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <IncomeTypeCard type="SALARY" amount={45000} />
            <IncomeTypeCard type="RENTAL" amount={15000} />
            <IncomeTypeCard type="DIVIDEND" amount={2500} />
            <IncomeTypeCard type="FREELANCE" amount={8000} />
          </div>
        </CardContent>
      </Card>

      {/* Incomes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gelir Listesi</CardTitle>
          <CardDescription>Tum gelirleriniz</CardDescription>
        </CardHeader>
        <CardContent>
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
              {mockIncomes.map((income) => {
                const typeInfo = incomeTypes[income.type] ?? incomeTypes.OTHER!;
                return (
                  <TableRow key={income.id}>
                    <TableCell>
                      <Badge className={typeInfo!.color}>{typeInfo!.label}</Badge>
                    </TableCell>
                    <TableCell>{income.description}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      +₺{income.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{new Date(income.date).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell>
                      {income.isRecurring ? (
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

function IncomeTypeCard({ type, amount }: { type: string; amount: number }) {
  const typeInfo = incomeTypes[type] ?? incomeTypes.OTHER!;
  return (
    <div className="p-4 bg-gray-50 rounded-lg text-center">
      <Badge className={typeInfo!.color}>{typeInfo!.label}</Badge>
      <p className="text-xl font-bold mt-2">₺{amount.toLocaleString()}</p>
    </div>
  );
}
