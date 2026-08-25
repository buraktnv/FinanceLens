"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssistant } from "./provider";

export function AssistantSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings, updateSettings } = useAssistant();
  const [draft, setDraft] = useState(settings);

  const save = () => {
    updateSettings(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asistan Ayarları</DialogTitle>
          <DialogDescription>
            Varsayımlar projeksiyonları doğrudan etkiler. API anahtarı yalnızca
            bu tarayıcıda saklanır.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="assistant-return">Yıllık getiri %</Label>
              <Input
                id="assistant-return"
                type="number"
                min={-50}
                max={200}
                value={draft.annualReturnPct}
                onChange={(e) =>
                  setDraft({ ...draft, annualReturnPct: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assistant-inflation">Yıllık enflasyon %</Label>
              <Input
                id="assistant-inflation"
                type="number"
                min={0}
                max={200}
                value={draft.annualInflationPct}
                onChange={(e) =>
                  setDraft({ ...draft, annualInflationPct: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            Gerçek getiri:{" "}
            <span className="font-medium text-foreground">
              %{(
                ((1 + draft.annualReturnPct / 100) / (1 + draft.annualInflationPct / 100) - 1) * 100
              ).toFixed(1)}
            </span>{" "}
            — projeksiyonlar reel bazda yapılır.
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assistant-provider">LLM sağlayıcısı (isteğe bağlı)</Label>
            <Select
              value={draft.provider}
              onValueChange={(v) => setDraft({ ...draft, provider: v as typeof draft.provider })}
            >
              <SelectTrigger id="assistant-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openrouter">OpenRouter (ücretsiz modeller)</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="claude">Anthropic Claude</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assistant-key">API anahtarı</Label>
            <Input
              id="assistant-key"
              type="password"
              placeholder="Boş bırakırsan kural tabanlı yanıtlar kullanılır"
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Anahtar sunucuda saklanmaz; her istekte başlıkla iletilir ve
              yanıt sonunda atılır.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button onClick={save}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
