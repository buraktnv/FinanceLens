"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ProviderId } from "@/lib/assistant/providers";

export interface AssistantSettings {
  apiKey: string;
  provider: ProviderId;
  annualReturnPct: number;
  annualInflationPct: number;
}

const DEFAULT_SETTINGS: AssistantSettings = {
  apiKey: "",
  provider: "openai",
  annualReturnPct: 30,
  annualInflationPct: 25,
};

const STORAGE_KEY = "financelens-assistant-settings";

interface AssistantContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  settings: AssistantSettings;
  updateSettings: (patch: Partial<AssistantSettings>) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

function loadSettings(): AssistantSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AssistantSettings>;
    const provider =
      parsed.provider && ["openai", "gemini", "claude"].includes(parsed.provider)
        ? (parsed.provider as ProviderId)
        : DEFAULT_SETTINGS.provider;
    return {
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      provider,
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

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AssistantSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const updateSettings = (patch: Partial<AssistantSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable (private mode) — keep in-memory only
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
