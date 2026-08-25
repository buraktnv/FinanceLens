import { describe, expect, it, vi, beforeEach } from "vitest";

const narrateMock = vi.fn();

vi.mock("@/lib/assistant/providers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/assistant/providers")>();
  return { ...actual, narrate: (...args: unknown[]) => narrateMock(...args) };
});

import { POST } from "../../../app/api/assistant/route";

beforeEach(() => {
  narrateMock.mockReset();
});

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const validBody = {
  provider: "openai",
  systemPrompt: "sistem",
  userPrompt: "kullanici",
};

describe("POST /api/assistant", () => {
  it("returns 400 when the key header is missing", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    expect(narrateMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid provider", async () => {
    const res = await POST(
      makeRequest({ ...validBody, provider: "nope" }, { "x-assistant-key": "k" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 502 with sanitized body when narration fails", async () => {
    narrateMock.mockRejectedValue(new Error("bad key secret-123"));
    const res = await POST(
      makeRequest(validBody, { "x-assistant-key": "secret-123" }),
    );
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(JSON.stringify(json)).not.toContain("secret-123");
  });

  it("relays to narrate and returns the reply", async () => {
    narrateMock.mockResolvedValue("Cevap metni");
    const res = await POST(
      makeRequest({ ...validBody, model: "openrouter/free" }, { "x-assistant-key": "k" }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reply: "Cevap metni" });
    expect(narrateMock).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "openai", model: "openrouter/free" }),
    );
  });

  it("omits the model field when it is absent or blank", async () => {
    narrateMock.mockResolvedValue("Cevap");
    await POST(makeRequest({ ...validBody, model: "   " }, { "x-assistant-key": "k" }));
    expect(narrateMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: undefined }),
    );
  });
});
