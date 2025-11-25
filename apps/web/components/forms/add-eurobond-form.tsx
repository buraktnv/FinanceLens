"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { eurobondsApi, CreateEurobondInput } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface AddEurobondFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddEurobondForm({ onSuccess, onCancel }: AddEurobondFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateEurobondInput>({
    name: "",
    isin: "",
    faceValue: 0,
    purchasePrice: 100,
    quantity: 1,
    couponRate: 0,
    currency: "USD",
    purchaseDate: new Date().toISOString().split("T")[0],
    maturityDate: "",
    couponFrequency: 2,
    broker: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (data: CreateEurobondInput) => eurobondsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eurobonds"] });
      queryClient.invalidateQueries({ queryKey: ["eurobonds", "summary"] });
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Tahvil Adi *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="TR240826T035"
            required
          />
        </div>
        <div>
          <Label htmlFor="isin">ISIN</Label>
          <Input
            id="isin"
            value={formData.isin}
            onChange={(e) => setFormData({ ...formData, isin: e.target.value })}
            placeholder="XS1234567890"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="faceValue">Nominal Deger *</Label>
          <Input
            id="faceValue"
            type="number"
            step="0.01"
            value={formData.faceValue || ""}
            onChange={(e) => setFormData({ ...formData, faceValue: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="quantity">Adet *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            value={formData.quantity || ""}
            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="purchasePrice">Alis Fiyati (%) *</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="0.0001"
            value={formData.purchasePrice || ""}
            onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">Yuzde olarak (ornek: 98.50)</p>
        </div>
        <div>
          <Label htmlFor="couponRate">Kupon Orani (%) *</Label>
          <Input
            id="couponRate"
            type="number"
            step="0.0001"
            value={formData.couponRate ? formData.couponRate * 100 : ""}
            onChange={(e) => setFormData({ ...formData, couponRate: parseFloat(e.target.value) / 100 || 0 })}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">Yuzde olarak (ornek: 5.75)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="couponFrequency">Kupon Odeme Donemi *</Label>
          <Select
            value={String(formData.couponFrequency)}
            onValueChange={(value) => setFormData({ ...formData, couponFrequency: parseInt(value) })}
          >
            <SelectTrigger id="couponFrequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Yilda 1 Kez (Yillik)</SelectItem>
              <SelectItem value="2">Yilda 2 Kez (6 Ayda Bir)</SelectItem>
              <SelectItem value="4">Yilda 4 Kez (3 Ayda Bir)</SelectItem>
              <SelectItem value="12">Yilda 12 Kez (Aylik)</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <Label htmlFor="maturityDate">Vade Tarihi *</Label>
          <Input
            id="maturityDate"
            type="date"
            value={formData.maturityDate}
            onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
            required
          />
        </div>
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
