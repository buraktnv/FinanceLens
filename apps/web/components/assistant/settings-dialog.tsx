"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssistant } from "./provider";
import {
  fetchOpenRouterModels,
  PROVIDER_DEFAULT_MODELS,
  type OpenRouterModelOption,
  type ProviderId,
} from "@/lib/assistant/providers";

const MODEL_OPTIONS: Record<Exclude<ProviderId, "openrouter">, { id: string; label: string }[]> = {
  openai: [
    { id: "gpt-4o-mini", label: "GPT-4o mini (hızlı, ucuz)" },
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
    { id: "gpt-4.1", label: "GPT-4.1 (en güçlü)" },
  ],
  gemini: [
    { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (hızlı)" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro (güçlü)" },
  ],
  claude: [
    { id: "claude-3-5-haiku-latest", label: "Claude Haiku 3.5 (hızlı)" },
    { id: "claude-3-5-sonnet-latest", label: "Claude Sonnet 3.5 (güçlü)" },
  ],
};

function ModelSelect({
  provider,
  value,
  onChange,
}: {
  provider: ProviderId;
  value: string;
  onChange: (model: string) => void;
}) {
  const isRouter = provider === "openrouter";
  const { data: routerModels, isFetching } = useQuery({
    queryKey: ["openrouter-models"],
    queryFn: ({ signal }) => fetchOpenRouterModels(signal),
    enabled: isRouter,
    staleTime: 10 * 60 * 1000,
  });

  // Ensure the currently stored model is always a visible option.
  const ensureOption = (list: OpenRouterModelOption[]): OpenRouterModelOption[] =>
    list.some((m) => m.id === value)
      ? list
      : [{ id: value, name: value, free: false }, ...list];

  return (
    <div className="space-y-1.5">
      <Label htmlFor="assistant-model">Model</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="assistant-model">
          <SelectValue placeholder={isRouter ? "Modeller yükleniyor…" : "Model seç"} />
        </SelectTrigger>
        <SelectContent>
          {!isRouter &&
            MODEL_OPTIONS[provider].map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}

          {isRouter && (
            <>
              {(routerModels ?? []).filter((m) => m.free).length > 0 && (
                <SelectGroup>
                  <SelectLabel>Ücretsiz modeller</SelectLabel>
                  {ensureOption(
                    (routerModels ?? []).filter((m) => m.free),
                  ).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              {(routerModels ?? []).filter((m) => !m.free).length > 0 && (
                <SelectGroup>
                  <SelectLabel>Popüler (ücretli)</SelectLabel>
                  {(routerModels ?? [])
                    .filter((m) => !m.free)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              )}
              {isFetching && !routerModels && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Katalog yükleniyor…
                </div>
              )}
            </>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {isRouter
          ? "Katalog canlı olarak OpenRouter'dan çekilir; ücretsiz modeller üsttedir."
          : "Sağlayıcının önerilen modelleri."}
      </p>
    </div>
  );
}

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
              onValueChange={(v) => {
                const nextProvider = v as ProviderId;
                setDraft({
                  ...draft,
                  provider: nextProvider,
                  model: PROVIDER_DEFAULT_MODELS[nextProvider],
                });
              }}
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

          <ModelSelect
            provider={draft.provider}
            value={draft.model}
            onChange={(model) => setDraft({ ...draft, model })}
          />

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
              Bu cihazda AES-GCM ile şifrelenir; sunucuya hiç gönderilmez.
              Sağlayıcı tarafında harcama limiti koymanız önerilir.
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
