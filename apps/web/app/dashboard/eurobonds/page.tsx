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
import { Plus, Calendar, Loader2 } from "lucide-react";
import { eurobondsApi } from "@/lib/api";

export default function EurobondsPage() {
  const { data: eurobonds = [], isLoading: bondsLoading, error: bondsError } = useQuery({
    queryKey: ["eurobonds"],
    queryFn: () => eurobondsApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["eurobonds", "summary"],
    queryFn: () => eurobondsApi.getSummary(),
  });

  const isLoading = bondsLoading || summaryLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (bondsError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">
          {bondsError instanceof Error ? bondsError.message : "Veri yuklenirken hata olustu"}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tekrar Dene
        </Button>
      </div>
    );
  }

  const totalFaceValue = summary?.totalFaceValue ?? 0;
  const totalCurrentValue = summary?.totalCurrentValue ?? 0;
  const annualCouponIncome = summary?.annualCouponIncome ?? 0;
  const avgYield = totalFaceValue > 0 ? ((annualCouponIncome / totalFaceValue) * 100).toFixed(2) : "0";

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
            <div className="text-2xl font-bold text-green-600">${annualCouponIncome.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ortalama Getiri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{avgYield}</div>
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
          {eurobonds.length > 0 ? (
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
                {eurobonds.map((bond) => {
                  const faceValue = Number(bond.faceValue);
                  const purchasePrice = Number(bond.purchasePrice);
                  const couponRate = Number(bond.couponRate) * 100;
                  const annualIncome = faceValue * Number(bond.couponRate);
                  const maturityDate = new Date(bond.maturityDate);
                  const yearsToMaturity = ((maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);

                  return (
                    <TableRow key={bond.id}>
                      <TableCell className="font-medium">{bond.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{bond.isin || "-"}</TableCell>
                      <TableCell className="text-right">${faceValue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{purchasePrice.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">%{couponRate.toFixed(2)}</Badge>
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
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henuz eurobond eklenmedi</p>
              <Button className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Ilk Eurobondunuzu Ekleyin
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Coupons */}
      <Card>
        <CardHeader>
          <CardTitle>Kupon Odemeleri</CardTitle>
          <CardDescription>Alinan kupon odemeleri</CardDescription>
        </CardHeader>
        <CardContent>
          {eurobonds.some(b => b.couponPayments && b.couponPayments.length > 0) ? (
            <div className="space-y-4">
              {eurobonds.flatMap(bond =>
                (bond.couponPayments || []).map(payment => (
                  <CouponItem
                    key={payment.id}
                    bond={bond.name}
                    date={new Date(payment.paymentDate).toLocaleDateString("tr-TR")}
                    amount={`$${Number(payment.amount).toLocaleString()}`}
                  />
                ))
              ).slice(0, 5)}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Henuz kupon odemesi yok</p>
          )}
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
