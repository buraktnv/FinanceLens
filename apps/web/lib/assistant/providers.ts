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
