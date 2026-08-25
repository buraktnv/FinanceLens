import { NextResponse } from "next/server";
import { narrate, PROVIDER_IDS, type ProviderId } from "@/lib/assistant/providers";

export const runtime = "nodejs";

interface AssistantRequestBody {
  provider?: string;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
}

/**
 * Relays a narration request to the user's chosen LLM provider using their
 * own API key (x-assistant-key header). The key is never stored or logged;
 * upstream errors are sanitized before reaching the client.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const apiKey = request.headers.get("x-assistant-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "x-assistant-key basligi gerekli" },
      { status: 400 },
    );
  }

  let body: AssistantRequestBody;
  try {
    body = (await request.json()) as AssistantRequestBody;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON govdesi" }, { status: 400 });
  }

  const provider = body.provider as ProviderId | undefined;
  if (!provider || !PROVIDER_IDS.includes(provider)) {
    return NextResponse.json({ error: "Gecersiz saglayici" }, { status: 400 });
  }

  if (!body.systemPrompt || !body.userPrompt) {
    return NextResponse.json(
      { error: "systemPrompt ve userPrompt zorunlu" },
      { status: 400 },
    );
  }

  try {
    const reply = await narrate({
      provider,
      apiKey,
      systemPrompt: body.systemPrompt,
      userPrompt: body.userPrompt,
      model:
        typeof body.model === "string" && body.model.trim()
          ? body.model.trim().slice(0, 120)
          : undefined,
    });
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "LLM saglayicisina ulasilamadi" },
      { status: 502 },
    );
  }
}
