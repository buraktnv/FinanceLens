import { afterEach, describe, expect, it, vi } from "vitest";
import { narrate, type ProviderId } from "../providers";

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
});
