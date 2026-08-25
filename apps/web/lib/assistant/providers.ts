export type ProviderId = "openai" | "gemini" | "claude" | "openrouter";

export const PROVIDER_IDS: ProviderId[] = ["openai", "gemini", "claude", "openrouter"];

/** Fallback model per provider when the user has not chosen one. */
export const PROVIDER_DEFAULT_MODELS: Record<ProviderId, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-1.5-flash",
  claude: "claude-3-5-haiku-latest",
  // Auto-router: survives OpenRouter's free-model roster rotating.
  openrouter: "openrouter/free",
};

export interface OpenRouterModelOption {
  id: string;
  name: string;
  free: boolean;
}

interface OpenRouterModelsResponse {
  data?: Array<{
    id?: string;
    name?: string;
    context_length?: number;
    pricing?: { prompt?: string };
  }>;
}

const MODEL_LIST_TTL_MS = 10 * 60 * 1000;
let modelListCache: {
  at: number;
  options: OpenRouterModelOption[];
} | null = null;

/**
 * Live catalog of OpenRouter models (public endpoint, no key needed).
 * Returns free models (largest context first, capped) plus popular paid
 * picks when available. Falls back to sensible seeds if upstream fails,
 * so the settings dialog never renders an empty picker.
 */
export async function fetchOpenRouterModels(
  signal?: AbortSignal,
): Promise<OpenRouterModelOption[]> {
  if (modelListCache && Date.now() - modelListCache.at < MODEL_LIST_TTL_MS) {
    return modelListCache.options;
  }

  let options: OpenRouterModelOption[];
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      signal: signal ?? AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as OpenRouterModelsResponse;

    const models = (json.data ?? []).filter(
      (m): m is { id: string; name: string; context_length?: number; pricing?: { prompt?: string } } =>
        typeof m.id === "string" && m.id.length > 0,
    );

    const toOption = (m: (typeof models)[number]): OpenRouterModelOption => ({
      id: m.id,
      name: m.name ?? m.id,
      free: m.pricing?.prompt === "0" || m.id.endsWith(":free"),
    });

    const free = models
      .map(toOption)
      .filter((m) => m.free)
      .sort((a, b) => b.id.length - a.id.length || a.name.localeCompare(b.name))
      .slice(0, 30);

    const popularIds = [
      "openai/gpt-4o-mini",
      "anthropic/claude-3.5-sonnet",
      "google/gemini-flash-1.5",
      "meta-llama/llama-3.1-70b-instruct",
      "mistralai/mistral-small",
    ];
    const popular = models
      .filter((m) => popularIds.includes(m.id))
      .map(toOption)
      .filter((m) => !m.free);

    options =
      free.length > 0 || popular.length > 0
        ? [...free, ...popular]
        : FALLBACK_OPENROUTER_MODELS;
  } catch {
    options = FALLBACK_OPENROUTER_MODELS;
  }

  modelListCache = { at: Date.now(), options };
  return options;
}

export function clearOpenRouterModelsCache(): void {
  modelListCache = null;
}

/** Seeds used only when the live catalog cannot be reached. */
export const FALLBACK_OPENROUTER_MODELS: OpenRouterModelOption[] = [
  { id: "openrouter/free", name: "Free Models Router (otomatik)", free: true },
  {
    id: "meta-llama/llama-3.2-3b-instruct:free",
    name: "Llama 3.2 3B Instruct (free)",
    free: true,
  },
];

interface NarrateOptions {
  provider: ProviderId;
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  signal?: AbortSignal;
}

const TIMEOUT_MS = 30_000;

/**
 * Calls the chosen LLM provider with a grounded prompt and returns plain text.
 * The API key is used only for this request and never persisted or logged.
 * All errors are sanitized: upstream messages (which may echo the key) are
 * never surfaced.
 */
export async function narrate(opts: NarrateOptions): Promise<string> {
  const { provider, apiKey, systemPrompt, userPrompt, signal } = opts;
  const model = (opts.model ?? "").trim() || PROVIDER_DEFAULT_MODELS[provider];

  let url = "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: unknown;

  if (provider === "openai") {
    url = "https://api.openai.com/v1/chat/completions";
    headers.Authorization = `Bearer ${apiKey}`;
    body = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    };
  } else if (provider === "openrouter") {
    // `openrouter/free` auto-routes to whichever free models are currently
    // available, so the app survives the roster rotating month to month.
    url = "https://openrouter.ai/api/v1/chat/completions";
    headers.Authorization = `Bearer ${apiKey}`;
    headers["HTTP-Referer"] = "https://financelens.local";
    headers["X-Title"] = "FinanceLens";
    body = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    };
  } else if (provider === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.4 },
    };
  } else if (provider === "claude") {
    url = "https://api.anthropic.com/v1/messages";
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
    body = {
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    };
  } else {
    throw new Error("Desteklenmeyen LLM saglayicisi");
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    // Intentionally discard the upstream body: it can echo the API key.
    throw new Error(`LLM saglayicisindan hata alindi (HTTP ${response.status})`);
  }

  const data = await response.json();
  const text = extractText(provider, data);
  if (!text) {
    throw new Error("LLM saglayicisindan bos yanit geldi");
  }
  return text;
}

function extractText(provider: ProviderId, data: unknown): string | null {
  const d = data as Record<string, unknown>;
  if (provider === "openai" || provider === "openrouter") {
    const choices = d?.choices as Array<{ message?: { content?: string } }> | undefined;
    return choices?.[0]?.message?.content ?? null;
  }
  if (provider === "gemini") {
    const candidates = d?.candidates as
      | Array<{ content?: { parts?: Array<{ text?: string }> } }>
      | undefined;
    return candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") || null;
  }
  const content = d?.content as Array<{ text?: string }> | undefined;
  return content?.map((c) => c.text ?? "").join("") || null;
}
