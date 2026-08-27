"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ProviderId } from "@/lib/assistant/providers";
import { PROVIDER_DEFAULT_MODELS } from "@/lib/assistant/providers";
import { decryptSecret, encryptSecret } from "@/lib/assistant/secure-store";

export interface AssistantSettings {
  apiKey: string;
  provider: ProviderId;
  model: string;
  annualReturnPct: number;
  annualInflationPct: number;
}

const DEFAULT_SETTINGS: AssistantSettings = {
  apiKey: "",
  provider: "openrouter",
  model: PROVIDER_DEFAULT_MODELS.openrouter,
  annualReturnPct: 30,
  annualInflationPct: 25,
};

/** Anahtar dışındaki ayarlar düz JSON olarak tutulur. */
const SETTINGS_KEY = "financelens-assistant-settings";
/** API anahtarı ayrı, şifreli olarak tutulur. */
const SECRET_KEY = "financelens-assistant-key";

interface AssistantContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  settings: AssistantSettings;
  updateSettings: (patch: Partial<AssistantSettings>) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

function loadPlainSettings(): AssistantSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};

    const provider =
      typeof parsed.provider === "string" &&
      ["openai", "gemini", "claude", "openrouter"].includes(parsed.provider)
        ? (parsed.provider as ProviderId)
        : DEFAULT_SETTINGS.provider;

    return {
      apiKey: "",
      provider,
      model:
        typeof parsed.model === "string" && parsed.model.trim()
          ? parsed.model
          : PROVIDER_DEFAULT_MODELS[provider],
      annualReturnPct:
        typeof parsed.annualReturnPct === "number"
          ? parsed.annualReturnPct
          : DEFAULT_SETTINGS.annualReturnPct,
      annualInflationPct:
        typeof parsed.annualInflationPct === "number"
          ? parsed.annualInflationPct
          : DEFAULT_SETTINGS.annualInflationPct,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistPlainSettings(settings: AssistantSettings): void {
  try {
    const { apiKey: _apiKey, ...rest } = settings;
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest));
  } catch {
    // storage unavailable — in-memory only
  }
}

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AssistantSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      // 1) Düz ayarları yükle.
      const plain = loadPlainSettings();

      // 2) Eski sürümde JSON içine yazılmış düz anahtarı göçür.
      let legacyRaw: string | null = null;
      try {
        legacyRaw = window.localStorage.getItem(SETTINGS_KEY);
      } catch {
        legacyRaw = null;
      }
      let legacyKey = "";
      if (legacyRaw) {
        try {
          const parsed = JSON.parse(legacyRaw) as { apiKey?: unknown };
          if (typeof parsed.apiKey === "string" && parsed.apiKey.trim()) {
            legacyKey = parsed.apiKey;
          }
        } catch {
          // bozuk eski kayıt — yok say
        }
      }

      // 3) Şifreli depodan anahtarı çöz; yoksa eski düz anahtarı kullan.
      let storedSecret = "";
      try {
        storedSecret = await decryptSecret(
          window.localStorage.getItem(SECRET_KEY),
        );
      } catch {
        storedSecret = "";
      }

      const apiKey = storedSecret || legacyKey;

      if (!cancelled) {
        setSettings({ ...plain, apiKey });
      }

      // 4) Göç gerekiyorsa: anahtarı şifrele, eski düz alanı JSON'dan sil.
      if (legacyKey && !storedSecret) {
        try {
          window.localStorage.setItem(
            SECRET_KEY,
            await encryptSecret(legacyKey),
          );
        } catch {
          // şifreleme altyapısı yoksa düz depoya düşer (encryptSecret içinde)
        }
      }
      persistPlainSettings({ ...plain, apiKey: "" });
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = (patch: Partial<AssistantSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };

      persistPlainSettings(next);

      if (patch.apiKey !== undefined) {
        void encryptSecret(patch.apiKey)
          .then((enc) => {
            window.localStorage.setItem(SECRET_KEY, enc);
          })
          .catch(() => {
            // encryptSecret zaten plain fallback'e düşer; buraya düşmez
          });
      }

      return next;
    });
  };

  return (
    <AssistantContext.Provider value={{ open, setOpen, settings, updateSettings }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant(): AssistantContextValue {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return ctx;
}
