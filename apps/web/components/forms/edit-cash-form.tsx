"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cashApi, Cash } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface EditCashFormProps {
  cash: Cash;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditCashForm({ cash, onSuccess, onCancel }: EditCashFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    accountName: cash.accountName,
    balance: cash.balance,
    currency: cash.currency,
    accountType: cash.accountType || "",
    bankName: cash.bankName || "",
    notes: cash.notes || "",
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => cashApi.update(cash.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash"] });
      queryClient.invalidateQueries({ queryKey: ["cash", "summary"] });
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
      <div>
        <Label htmlFor="accountName">Hesap Adi *</Label>
        <Input
          id="accountName"
          value={formData.accountName}
          onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="balance">Bakiye *</Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
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
              <SelectItem value="TRY">TRY (₺)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="CHF">CHF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="accountType">Hesap Turu</Label>
          <Select
            value={formData.accountType}
            onValueChange={(value) => setFormData({ ...formData, accountType: value })}
          >
            <SelectTrigger id="accountType">
              <SelectValue placeholder="Hesap turu secin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Checking Account">Vadesiz Hesap</SelectItem>
              <SelectItem value="Savings Account">Tasarruf Hesabi</SelectItem>
              <SelectItem value="Waiting Cash">Bekleyen Nakit</SelectItem>
              <SelectItem value="Investment Account">Yatirim Hesabi</SelectItem>
              <SelectItem value="Other">Diger</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="bankName">Banka Adi</Label>
          <Input
            id="bankName"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notlar</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      {mutation.error && (
        <div className="text-sm text-red-600">
          Hata: {mutation.error instanceof Error ? mutation.error.message : "Bilinmeyen hata"}
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Iptal
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guncelle
        </Button>
      </div>
    </form>
  );
}
