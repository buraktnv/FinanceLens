"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { silverApi, CreateSilverInput } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface AddSilverFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddSilverForm({ onSuccess, onCancel }: AddSilverFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateSilverInput>({
    name: "",
    quantity: 0,
    purchasePrice: 0,
    purchaseDate: new Date().toISOString().split("T")[0],
    purity: "",
    location: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (data: CreateSilverInput) => silverApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["silver"] });
      queryClient.invalidateQueries({ queryKey: ["silver", "summary"] });
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
        <Label htmlFor="name">Gumus Adi *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Gumus Kulce, Gumus Sikke, vb."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Miktar (Gram) *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.001"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="purchasePrice">Alis Fiyati (TRY/gram) *</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="0.001"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
            required
          />
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
          <Label htmlFor="purity">Ayar</Label>
          <Select
            value={formData.purity}
            onValueChange={(value) => setFormData({ ...formData, purity: value })}
          >
            <SelectTrigger id="purity">
              <SelectValue placeholder="Ayar secin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="999">999</SelectItem>
              <SelectItem value="925">925</SelectItem>
              <SelectItem value="900">900</SelectItem>
              <SelectItem value="800">800</SelectItem>
              <SelectItem value="Other">Diger</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="location">Konum</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Banka kasasi, Ev kasasi, vb."
        />
      </div>

      <div>
        <Label htmlFor="notes">Notlar</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Ek bilgiler..."
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
          Ekle
        </Button>
      </div>
    </form>
  );
}
