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
import { Plus, Loader2 } from "lucide-react";
import { etfsApi } from "@/lib/api";
import { AddETFForm } from "@/components/forms/add-etf-form";

export default function ETFsPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { data: etfs = [], isLoading: etfsLoading, error: etfsError } = useQuery({
    queryKey: ["etfs"],
    queryFn: () => etfsApi.getAll(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["etfs", "summary"],
    queryFn: () => etfsApi.getSummary(),
  });

  const isLoading = etfsLoading || summaryLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (etfsError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">
          {etfsError instanceof Error ? etfsError.message : "Veri yuklenirken hata olustu"}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tekrar Dene
        </Button>
      </div>
    );
  }

  const totalValue = summary?.totalValue ?? 0;
  const totalDistributions = summary?.totalDistributions ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ETF'ler</h1>
          <p className="text-muted-foreground">ETF portfoyunuzu yonetin</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          Yeni ETF Ekle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Deger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Dagitim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalDistributions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ETF Sayisi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalEtfs ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* ETFs Table */}
      <Card>
        <CardHeader>
          <CardTitle>ETF Portfoyu</CardTitle>
          <CardDescription>Tum ETF'leriniz</CardDescription>
        </CardHeader>
        <CardContent>
          {etfs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sembol</TableHead>
                  <TableHead>ETF Adi</TableHead>
                  <TableHead className="text-right">Adet</TableHead>
                  <TableHead className="text-right">Alis Fiyati</TableHead>
                  <TableHead className="text-right">Gider Orani</TableHead>
                  <TableHead className="text-right">Toplam Maliyet</TableHead>
                  <TableHead className="text-right">Alis Tarihi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {etfs.map((etf) => {
                  const quantity = Number(etf.quantity);
                  const purchasePrice = Number(etf.purchasePrice);
                  const totalCost = quantity * purchasePrice;
                  const expenseRatio = etf.expenseRatio ? Number(etf.expenseRatio) * 100 : null;

                  return (
                    <TableRow key={etf.id}>
                      <TableCell className="font-medium">{etf.symbol}</TableCell>
                      <TableCell>{etf.name}</TableCell>
                      <TableCell className="text-right">{quantity}</TableCell>
                      <TableCell className="text-right">${purchasePrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {expenseRatio !== null ? (
                          <Badge variant="outline">%{expenseRatio.toFixed(2)}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right">${totalCost.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {new Date(etf.purchaseDate).toLocaleDateString("tr-TR")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henuz ETF eklenmedi</p>
              <Button className="mt-4 gap-2" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4" />
                Ilk ETF'inizi Ekleyin
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add ETF Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni ETF Ekle</DialogTitle>
            <DialogDescription>
              Yahoo Finance'dan sembol arayarak ETF'lerinizi ekleyin
            </DialogDescription>
          </DialogHeader>
          <AddETFForm
            onSuccess={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Distributions */}
      <Card>
        <CardHeader>
          <CardTitle>Son Dagitimlar</CardTitle>
          <CardDescription>ETF temettu ve dagitimlariniz</CardDescription>
        </CardHeader>
        <CardContent>
          {etfs.some(e => e.distributions && e.distributions.length > 0) ? (
            <div className="space-y-4">
              {etfs.flatMap(etf =>
                (etf.distributions || []).map(dist => (
                  <DistributionItem
                    key={dist.id}
                    etf={etf.symbol}
                    type={dist.type}
                    date={new Date(dist.paymentDate).toLocaleDateString("tr-TR")}
                    amount={`$${Number(dist.amount).toFixed(2)}`}
                  />
                ))
              ).slice(0, 5)}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Henuz dagitim yok</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DistributionItem({ etf, type, date, amount }: { etf: string; type: string; date: string; amount: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium">{etf} - {type}</p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <span className="font-medium text-green-600">{amount}</span>
    </div>
  );
}
