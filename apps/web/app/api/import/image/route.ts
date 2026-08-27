import { NextResponse } from "next/server";
import {
  extractFromImage,
  narrate,
  PROVIDER_IDS,
  type ProviderId,
} from "@/lib/assistant/providers";

export const runtime = "nodejs";

interface ImportRequestBody {
  provider?: string;
  model?: string;
  prompt?: string;
  /** Vision yolu: dataURL. */
  imageBase64?: string;
  /** OCR yolu: ham metin (yapılandırma için yine LLM'e gider). */
  ocrText?: string;
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Görselden/metinden varlık çıkarma köprüsü: istemcinin kendi API anahtarı
 * ile seçtiği sağlayıcıya iletir. Görsel ve metin HİÇBİR yerde saklanmaz;
 * upstream hataları sanitize edilir.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const apiKey = request.headers.get("x-assistant-key");
  if (!apiKey || apiKey.length < 8) {
    return bad("Gecerli bir x-assistant-key basligi gerekli");
  }

  let body: ImportRequestBody;
  try {
    body = (await request.json()) as ImportRequestBody;
  } catch {
    return bad("Gecersiz JSON govdesi");
  }

  const provider = body.provider as ProviderId | undefined;
  if (!provider || !PROVIDER_IDS.includes(provider)) {
    return bad("Gecersiz saglayici");
  }
  if (!body.prompt || typeof body.prompt !== "string") {
    return bad("prompt zorunlu");
  }

  const model =
    typeof body.model === "string" && body.model.trim()
      ? body.model.trim().slice(0, 120)
      : undefined;

  const hasImage = typeof body.imageBase64 === "string" && body.imageBase64.length > 64;
  const hasText = typeof body.ocrText === "string" && body.ocrText.trim().length > 0;
  if (!hasImage && !hasText) {
    return bad("imageBase64 veya ocrText gerekli");
  }

  try {
    let raw: string;
    if (hasImage && body.imageBase64) {
      raw = await extractFromImage({
        provider,
        apiKey,
        model,
        systemPrompt:
          "Sen finansal belge goruntulerinden yapisal veri cikaran bir extraction motorusun. " +
          "Sayilari birebir aktar, tahmin etme, eksik alanlari null birak. " +
          "Yalnizca istenen JSON'u don, baska metin ekleme.",
        userPrompt: body.prompt as string,
        imageDataUrl: body.imageBase64 as string,
      });
    } else {
      raw = await narrate({
        provider,
        apiKey,
        model,
        systemPrompt:
          "Sen finansal belgelerden yapisal veri cikaran bir extraction motorusun. " +
          "Sayilari birebir aktar, tahmin etme, eksik alanlari null birak. " +
          "Yalnizca istenen JSON'u don, baska metin ekleme.",
        userPrompt: `${body.prompt as string}\n\n${body.ocrText ?? ""}`.trim(),
      });
    }

    return NextResponse.json({ raw });
  } catch {
    return bad("Cikarma sirasinda saglayiciya ulasilamadi", 502);
  }
}
