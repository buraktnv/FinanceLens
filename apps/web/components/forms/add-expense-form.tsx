"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { expensesApi, CreateExpenseInput } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface AddExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddExpenseForm({ onSuccess, onCancel }: AddExpenseFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateExpenseInput>({
    amount: 0,
    currency: "TRY",
    category: "FOOD",
    description: "",
    date: new Date().toISOString().split("T")[0],
    isRecurring: false,
    frequency: "",
    paymentMethod: "CREDIT_CARD",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (data: CreateExpenseInput) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses", "summary"] });
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
          <Label htmlFor="amount">Miktar *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount || ""}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            required
          />
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
              <SelectItem value="TRY">TRY</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="category">Kategori *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RENT">Kira</SelectItem>
            <SelectItem value="UTILITIES">Faturalar</SelectItem>
            <SelectItem value="FOOD">Market</SelectItem>
            <SelectItem value="TRANSPORTATION">Ulasim</SelectItem>
            <SelectItem value="EDUCATION">Egitim</SelectItem>
            <SelectItem value="HEALTHCARE">Saglik</SelectItem>
            <SelectItem value="ENTERTAINMENT">Eglence</SelectItem>
            <SelectItem value="SHOPPING">Alisveris</SelectItem>
            <SelectItem value="INSURANCE">Sigorta</SelectItem>
            <SelectItem value="OTHER">Diger</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="paymentMethod">Odeme Yontemi</Label>
        <Select
          value={formData.paymentMethod}
          onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
        >
          <SelectTrigger id="paymentMethod">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CASH">Nakit</SelectItem>
            <SelectItem value="CREDIT_CARD">Kredi Karti</SelectItem>
            <SelectItem value="DEBIT_CARD">Banka Karti</SelectItem>
            <SelectItem value="BANK_TRANSFER">Havale/EFT</SelectItem>
            <SelectItem value="OTHER">Diger</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Aciklama</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Opsiyonel"
        />
      </div>

      <div>
        <Label htmlFor="date">Tarih *</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRecurring"
          checked={formData.isRecurring}
          onCheckedChange={(checked) =>
            setFormData({
              ...formData,
              isRecurring: checked as boolean,
              frequency: checked ? "MONTHLY" : ""
            })
          }
        />
        <Label htmlFor="isRecurring" className="cursor-pointer">
          Tekrarlayan Gider
        </Label>
      </div>

      {formData.isRecurring && (
        <div>
          <Label htmlFor="frequency">Tekrar Donemi *</Label>
          <Select
            value={formData.frequency}
            onValueChange={(value) => setFormData({ ...formData, frequency: value })}
          >
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Gunluk</SelectItem>
              <SelectItem value="WEEKLY">Haftalik</SelectItem>
              <SelectItem value="MONTHLY">Aylik</SelectItem>
              <SelectItem value="QUARTERLY">3 Aylik</SelectItem>
              <SelectItem value="SEMI_ANNUAL">6 Aylik</SelectItem>
              <SelectItem value="ANNUAL">Yillik</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

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
