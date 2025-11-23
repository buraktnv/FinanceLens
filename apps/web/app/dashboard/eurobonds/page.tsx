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
import { Plus, Calendar } from "lucide-react";

const mockEurobonds = [
  { name: "Turkey 2030", isin: "US900123AB45", faceValue: 10000, purchasePrice: 95.5, couponRate: 5.75, maturityDate: "2030-03-15", currency: "USD" },
  { name: "Turkey 2034", isin: "US900123CD67", faceValue: 15000, purchasePrice: 92.0, couponRate: 6.25, maturityDate: "2034-09-20", currency: "USD" },
  { name: "Turkey 2028", isin: "US900123EF89", faceValue: 5000, purchasePrice: 98.0, couponRate: 5.25, maturityDate: "2028-06-10", currency: "USD" },
];

export default function EurobondsPage() {
  const totalFaceValue = mockEurobonds.reduce((sum, bond) => sum + bond.faceValue, 0);
  const totalCurrentValue = mockEurobonds.reduce((sum, bond) => sum + (bond.faceValue * bond.purchasePrice / 100), 0);
  const annualCoupon = mockEurobonds.reduce((sum, bond) => sum + (bond.faceValue * bond.couponRate / 100), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eurobond</h1>
          <p className="text-muted-foreground">Eurobond portfoyunuzu yonetin</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Eurobond Ekle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nominal Deger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFaceValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Guncel Deger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCurrentValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yillik Kupon Geliri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${annualCoupon.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ortalama Getiri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%5.75</div>
          </CardContent>
        </Card>
      </div>

      {/* Eurobonds Table */}
      <Card>
        <CardHeader>
          <CardTitle>Eurobond Portfoyu</CardTitle>
          <CardDescription>Tum eurobondlariniz</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tahvil</TableHead>
                <TableHead>ISIN</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead className="text-right">Alis Fiyati</TableHead>
                <TableHead className="text-right">Kupon</TableHead>
                <TableHead className="text-right">Vade</TableHead>
                <TableHead className="text-right">Yillik Gelir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEurobonds.map((bond) => {
                const annualIncome = bond.faceValue * bond.couponRate / 100;
                const maturityDate = new Date(bond.maturityDate);
                const yearsToMaturity = ((maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);

                return (
                  <TableRow key={bond.isin}>
                    <TableCell className="font-medium">{bond.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{bond.isin}</TableCell>
                    <TableCell className="text-right">${bond.faceValue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{bond.purchasePrice}%</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">%{bond.couponRate}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{maturityDate.toLocaleDateString("tr-TR")}</span>
                        <span className="text-muted-foreground text-xs">({yearsToMaturity} yil)</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-green-600">${annualIncome.toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upcoming Coupons */}
      <Card>
        <CardHeader>
          <CardTitle>Yaklasan Kupon Odemeleri</CardTitle>
          <CardDescription>Onumuzdeki 6 ay icindeki kupon odemeleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <CouponItem bond="Turkey 2030" date="15 Mart 2024" amount="$287.50" />
            <CouponItem bond="Turkey 2028" date="10 Haziran 2024" amount="$131.25" />
            <CouponItem bond="Turkey 2034" date="20 Eylul 2024" amount="$468.75" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CouponItem({ bond, date, amount }: { bond: string; date: string; amount: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium">{bond}</p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <span className="font-medium text-green-600">{amount}</span>
    </div>
  );
}
