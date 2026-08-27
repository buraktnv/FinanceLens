import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearOpenRouterModelsCache,
  fetchOpenRouterModels,
  narrate,
  type ProviderId,
} from "../providers";

const KEY = "test-key-123";

interface CapturedCall {
  url: string;
  headers: Record<string, string>;
  body: string;
}

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockImplementation(async (url: string, init?: RequestInit) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    __captured: {
      url,
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: String(init?.body ?? "{}"),
    } satisfies CapturedCall,
  }));
}


afterEach(() => {
  vi.unstubAllGlobals();
});

describe("narrate", () => {
  it("calls OpenAI chat completions with bearer auth and returns content", async () => {
    const f = mockFetch(200, { choices: [{ message: { content: "Merhaba!" } }] });
    vi.stubGlobal("fetch", f);

    const reply = await narrate({
      provider: "openai",
      apiKey: KEY,
      systemPrompt: "sistem",
      userPrompt: "kullanici",
    });

    expect(reply).toBe("Merhaba!");
    const [url = "", init] = (f.mock.calls[0] ?? []) as [{ toString(): string }, RequestInit];
    const call = { url: String(url), headers: (init.headers ?? {}) as Record<string, string>, body: String(init.body ?? "{}") };
    expect(call.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(call.headers.Authorization).toBe(`Bearer ${KEY}`);
    expect(JSON.parse(call.body).model).toBeTruthy();
  });

  it("calls Gemini generateContent with key query param", async () => {
    const f = mockFetch(200, {
      candidates: [{ content: { parts: [{ text: "Gemini cevap" }] } }],
    });
    vi.stubGlobal("fetch", f);

    const reply = await narrate({
      provider: "gemini",
      apiKey: KEY,
      systemPrompt: "sistem",
      userPrompt: "kullanici",
    });

    expect(reply).toBe("Gemini cevap");
    const [url = ""] = (f.mock.calls[0] ?? []) as [{ toString(): string }];
    const call = { url: String(url), headers: {} as Record<string, string>, body: "" };
    expect(call.url).toContain("generativelanguage.googleapis.com");
    expect(call.url).toContain(KEY);
  });

  it("calls Claude messages API with x-api-key header", async () => {
    const f = mockFetch(200, { content: [{ text: "Claude cevap" }] });
    vi.stubGlobal("fetch", f);

    const reply = await narrate({
      provider: "claude",
      apiKey: KEY,
      systemPrompt: "sistem",
      userPrompt: "kullanici",
    });

    expect(reply).toBe("Claude cevap");
    const [url = "", init] = (f.mock.calls[0] ?? []) as [{ toString(): string }, RequestInit];
    const call = { url: String(url), headers: (init.headers ?? {}) as Record<string, string>, body: String(init.body ?? "") };
    expect(call.url).toContain("api.anthropic.com");
    expect(call.headers["x-api-key"]).toBe(KEY);
  });

  it("calls OpenRouter free router with bearer auth and openai-compatible shape", async () => {
    const f = mockFetch(200, {
      choices: [{ message: { content: "OpenRouter cevap" } }],
    });
    vi.stubGlobal("fetch", f);

    const reply = await narrate({
      provider: "openrouter",
      apiKey: KEY,
      systemPrompt: "sistem",
      userPrompt: "kullanici",
    });

    expect(reply).toBe("OpenRouter cevap");
    const [url = "", init] = (f.mock.calls[0] ?? []) as [{ toString(): string }, RequestInit];
    const call = { url: String(url), headers: (init.headers ?? {}) as Record<string, string>, body: String(init.body ?? "{}") };
    expect(call.url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(call.headers.Authorization).toBe(`Bearer ${KEY}`);
    expect(call.headers["X-Title"]).toBe("FinanceLens");
    const parsed = JSON.parse(call.body);
    expect(parsed.model).toBe("openrouter/free");
    expect(parsed.messages).toHaveLength(2);
  });

  it("throws sanitized error on upstream failure (no key leakage)", async () => {
    vi.stubGlobal("fetch", mockFetch(401, { error: { message: `bad key ${KEY}` } }));
    await expect(
      narrate({ provider: "openai", apiKey: KEY, systemPrompt: "s", userPrompt: "u" }),
    ).rejects.toThrow(/LLM saglayicisindan hata/i);
    await expect(
      narrate({ provider: "openai", apiKey: KEY, systemPrompt: "s", userPrompt: "u" }),
    ).rejects.not.toThrow(new RegExp(KEY));
  });

  it("rejects unknown providers up front", async () => {
    await expect(
      narrate({
        provider: "unknown" as ProviderId,
        apiKey: KEY,
        systemPrompt: "s",
        userPrompt: "u",
      }),
    ).rejects.toThrow(/desteklenmeyen/i);
  });

  it("uses the provider default model when none is given", async () => {
    const f = mockFetch(200, { choices: [{ message: { content: "ok" } }] });
    vi.stubGlobal("fetch", f);

    await narrate({ provider: "openai", apiKey: KEY, systemPrompt: "s", userPrompt: "u" });

    const [, init] = (f.mock.calls[0] ?? []) as [string, RequestInit];
    expect(JSON.parse(String(init.body)).model).toBe("gpt-4o-mini");
  });

  it("honors an explicit model override", async () => {
    const f = mockFetch(200, { choices: [{ message: { content: "ok" } }] });
    vi.stubGlobal("fetch", f);

    await narrate({
      provider: "openai",
      apiKey: KEY,
      systemPrompt: "s",
      userPrompt: "u",
      model: "  gpt-4.1-mini ",
    });

    const [, init] = (f.mock.calls[0] ?? []) as [string, RequestInit];
    expect(JSON.parse(String(init.body)).model).toBe("gpt-4.1-mini");
  });

  it("keeps openrouter/free as its default model id", async () => {
    const f = mockFetch(200, {
      choices: [{ message: { content: "ok" } }],
    });
    vi.stubGlobal("fetch", f);

    await narrate({ provider: "openrouter", apiKey: KEY, systemPrompt: "s", userPrompt: "u" });

    const [, init] = (f.mock.calls[0] ?? []) as [string, RequestInit];
    expect(JSON.parse(String(init.body)).model).toBe("openrouter/free");
  });
});

describe("fetchOpenRouterModels", () => {
  afterEach(() => {
    clearOpenRouterModelsCache();
    vi.unstubAllGlobals();
  });

  it("filters free models and appends popular paid picks", async () => {
    clearOpenRouterModelsCache();
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        data: [
          { id: "openai/gpt-4o-mini", name: "GPT-4o mini", pricing: { prompt: "0.00000015" } },
          { id: "qwen/qwen-2.5-72b-instruct:free", name: "Qwen 72B (free)", pricing: { prompt: "0" } },
          { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Llama 3.2 (free)", pricing: {} },
          { id: "mistralai/mistral-small", name: "Mistral Small", pricing: { prompt: "0.000002" } },
        ],
      }),
    );

    const options = await fetchOpenRouterModels();

    const free = options.filter((o) => o.free).map((o) => o.id);
    expect(free).toContain("qwen/qwen-2.5-72b-instruct:free");
    expect(free).toContain("meta-llama/llama-3.2-3b-instruct:free");
    expect(free).not.toContain("openai/gpt-4o-mini");

    const paid = options.filter((o) => !o.free).map((o) => o.id);
    expect(paid).toContain("openai/gpt-4o-mini");
    expect(paid).not.toContain("qwen/qwen-2.5-72b-instruct:free");
  });

  it("falls back to seed models when upstream fails", async () => {
    clearOpenRouterModelsCache();
    vi.stubGlobal("fetch", mockFetch(500, {}));
    const options = await fetchOpenRouterModels();
    expect(options.some((o) => o.id === "openrouter/free")).toBe(true);
  });

  it("serves a second call from cache without refetching", async () => {
    clearOpenRouterModelsCache();
    const f = mockFetch(200, {
      data: [{ id: "test/model:free", name: "Test (free)", pricing: { prompt: "0" } }],
    });
    vi.stubGlobal("fetch", f);

    await fetchOpenRouterModels();
    await fetchOpenRouterModels();

    expect(f).toHaveBeenCalledTimes(1);
    clearOpenRouterModelsCache();
  });
});
