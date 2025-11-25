"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { etfsApi, CreateETFInput } from "@/lib/api";
import { SymbolSearch } from "@/components/symbol-search";
import { Loader2 } from "lucide-react";

interface AddETFFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddETFForm({ onSuccess, onCancel }: AddETFFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateETFInput>({
    symbol: "",
    name: "",
    quantity: 0,
    purchasePrice: 0,
    currency: "USD",
    purchaseDate: new Date().toISOString().split("T")[0],
    expenseRatio: 0,
    broker: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (data: CreateETFInput) => etfsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etfs"] });
      queryClient.invalidateQueries({ queryKey: ["etfs", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SymbolSearch
        label="ETF Ara"
        placeholder="SPY, VOO, VTI..."
        onSelect={(result) => {
          setFormData({
            ...formData,
            symbol: result.symbol,
            name: result.name,
            purchasePrice: result.price || formData.purchasePrice,
          });
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="symbol">Sembol *</Label>
          <Input
            id="symbol"
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="name">ETF Adi *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Adet *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.00000001"
            value={formData.quantity || ""}
            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="purchasePrice">Alis Fiyati *</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="0.0001"
            value={formData.purchasePrice || ""}
            onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currency">Para Birimi</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="TRY">TRY</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="purchaseDate">Alis Tarihi *</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expenseRatio">Gider Orani (%)</Label>
          <Input
            id="expenseRatio"
            type="number"
            step="0.01"
            value={formData.expenseRatio || ""}
            onChange={(e) => setFormData({ ...formData, expenseRatio: parseFloat(e.target.value) / 100 || 0 })}
            placeholder="Ornek: 0.03"
          />
          <p className="text-xs text-muted-foreground mt-1">Yuzde olarak girin (ornek: 0.03% icin "0.03")</p>
        </div>
        <div>
          <Label htmlFor="broker">Broker</Label>
          <Input
            id="broker"
            value={formData.broker}
            onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
            placeholder="Opsiyonel"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notlar</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Opsiyonel"
          rows={3}
        />
      </div>

      {mutation.isError && (
        <div className="text-sm text-red-600">
          {mutation.error instanceof Error ? mutation.error.message : "Bir hata olustu"}
        </div>
      )}

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Iptal
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Kaydet
        </Button>
      </div>
    </form>
  );
}
