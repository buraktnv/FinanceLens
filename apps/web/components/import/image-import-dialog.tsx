"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ClipboardPaste, Loader2, Sparkles, Type } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useAssistant } from "../assistant/provider";
import { processImageFile } from "@/lib/import/image-utils";
import { runOcr } from "@/lib/import/ocr-client";
import {
  buildExtractionPrompt,
  buildTextExtractionPrompt,
  type ImportTarget,
} from "@/lib/import/schema-prompts";
import {
  parseExtractionResponse,
  type ExtractedRow,
} from "@/lib/import/parse-extraction";

type Engine = "vision" | "ocr-text" | null;

export function ImageImportDialog({
  open,
  onOpenChange,
  targetType,
  targetLabel,
  fieldOrder,
  onCommit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ImportTarget;
  targetLabel: string;
  /** İnceleme tablosunda gösterilecek alan anahtarları (sırayla). */
  fieldOrder: string[];
  /** Onaylanan satırlar; sayfa kendi API'sine çevirir. */
  onCommit: (rows: Record<string, string | number | null>[]) => Promise<void>;
}) {
  const { settings } = useAssistant();
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [engine, setEngine] = useState<Engine>(null);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<ExtractedRow[] | null>(null);
  const [committing, setCommitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setImageDataUrl(null);
    setOcrText("");
    setEngine(null);
    setRows(null);
    setBusy(false);
    setCommitting(false);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  // Panodan yapıştırma desteği
  useEffect(() => {
    if (!open) return;
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      const file = item?.getAsFile();
      if (file) void handleFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open]);

  async function handleFile(file: File | Blob) {
    try {
      setBusy(true);
      setRows(null);
      const processed = await processImageFile(file);
      setImageDataUrl(processed.dataUrl);
    } catch {
      toast.error("Görsel okunamadı");
    } finally {
      setBusy(false);
    }
  }

  async function extract(useVision: boolean) {
    if (!imageDataUrl && !ocrText) return;
    if (!settings.apiKey) {
      toast.error(
        useVision
          ? "Bu özellik için Ayarlar'dan bir API anahtarı gerekli"
          : "Metni yapılandırmak için de API anahtarı gerekli",
      );
      return;
    }

    setBusy(true);
    try {
      let raw = "";
      if (useVision && imageDataUrl) {
        setEngine("vision");
        const res = await fetch("/api/import/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-assistant-key": settings.apiKey,
          },
          body: JSON.stringify({
            provider: settings.provider,
            model: settings.model,
            prompt: buildExtractionPrompt(targetType),
            imageBase64: imageDataUrl,
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
        raw = ((await res.json()) as { raw?: string }).raw ?? "";
      } else {
        // OCR metni → yine LLM ile yapılandır (vision gerektirmez)
        setEngine("ocr-text");
        const text =
          ocrText ||
          (await runOcr(imageDataUrl as string).catch(() => {
            throw new Error("OCR başarısız oldu");
          }));
        setOcrText(text);
        const res = await fetch("/api/import/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-assistant-key": settings.apiKey,
          },
          body: JSON.stringify({
            provider: settings.provider,
            model: settings.model,
            prompt: buildTextExtractionPrompt(targetType, text),
            ocrText: text,
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
        raw = ((await res.json()) as { raw?: string }).raw ?? "";
      }

      const parsed = parseExtractionResponse(raw);
      if (parsed.error) {
        toast.error(parsed.error);
        setRows([]);
        return;
      }
      setRows(parsed.rows);
    } catch {
      toast.error("Çıkarma başarısız oldu");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!rows) return;
    const chosen = rows.filter((r) => r.selected);
    if (chosen.length === 0) return;

    setCommitting(true);
    try {
      await onCommit(chosen.map((r) => r.values));
      toast.success(`${chosen.length} kayıt eklendi`);
      onOpenChange(false);
    } catch {
      toast.error("Bazı kayıtlar eklenemedi");
    } finally {
      setCommitting(false);
    }
  }

  const updateCell = (
    index: number,
    key: string,
    value: string | number | null,
  ) => {
    setRows(
      (prev) =>
        prev?.map((row, i) =>
          i === index
            ? { ...row, values: { ...row.values, [key]: value }, flags: [] }
            : row,
        ) ?? prev,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Görselden {targetLabel} Ekle</DialogTitle>
          <DialogDescription>
            Broker ekran görüntünüzü yapıştırın veya yükleyin. Görsel hiçbir
            yerde saklanmaz; anahtarınızla doğrudan modelinize gider.
          </DialogDescription>
        </DialogHeader>

        {!imageDataUrl && !ocrText && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
            className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary-strong"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ClipboardPaste className="h-6 w-6" />
            )}
            <span>
              Görsele tıklayın veya panodan yapıştırın (Ctrl+V)
            </span>
            <span className="text-xs">
              Ekran görüntüsü, hesap özeti veya işlem geçmişi kabul edilir
            </span>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />

        {imageDataUrl && !rows && (
          <div className="space-y-3">
            <Image
              src={imageDataUrl}
              alt="Yüklenen belge"
              width={800}
              height={450}
              unoptimized
              className="max-h-56 w-full rounded-lg border object-contain"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void extract(true)} disabled={busy}>
                {busy ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 h-4 w-4" />
                )}
                Vision ile Çıkar
              </Button>
              <Button variant="outline" onClick={() => void extract(false)} disabled={busy}>
                {busy ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Type className="mr-1 h-4 w-4" />
                )}
                OCR ile Çıkar (anahtarsız deneme)
              </Button>
            </div>
          </div>
        )}

        {/* OCR ham metni — kullanıcı düzenleyebilir */}
        {engine === "ocr-text" && ocrText && !rows && (
          <textarea
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            rows={8}
            aria-label="OCR metni"
            className="w-full rounded-md border bg-muted/30 p-2 font-mono text-xs"
          />
        )}

        {rows && rows.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Satırları gözden geçirin; şüpheli değerler işaretlendi. Hücrelere
              tıklayıp düzeltebilirsiniz.
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="p-2 text-left">
                      <Checkbox
                        checked={rows.every((r) => r.selected)}
                        onCheckedChange={(v) =>
                          setRows(rows.map((r) => ({ ...r, selected: v === true })))
                        }
                        aria-label="Tümünü seç"
                      />
                    </th>
                    {fieldOrder.map((f) => (
                      <th key={f} className="p-2 text-left font-medium">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 align-top">
                      <td className="p-2">
                        <Checkbox
                          checked={row.selected}
                          onCheckedChange={(v) =>
                            setRows(
                              rows.map((r, ri) =>
                                ri === i ? { ...r, selected: v === true } : r,
                              ),
                            )
                          }
                          aria-label={`Satır ${i + 1} seç`}
                        />
                      </td>
                      {fieldOrder.map((f) => {
                        const isNum =
                          typeof row.values[f] === "number" ||
                          ["quantity", "purchasePrice", "pricePerGram", "grams", "faceValue", "balance", "amount"].includes(f);
                        return (
                          <td key={f} className="p-1.5 min-w-[7rem]">
                            <Input
                              value={
                                row.values[f] === null || row.values[f] === undefined
                                  ? ""
                                  : String(row.values[f])
                              }
                              onChange={(e) =>
                                updateCell(i, f, isNum ? Number(e.target.value) || null : e.target.value)
                              }
                              aria-label={`${f} satır ${i + 1}`}
                              className={`h-8 text-xs ${
                                row.flags.some((fl) => fl.startsWith(f))
                                  ? "border-warning"
                                  : ""
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.some((r) => r.flags.length > 0) && (
              <ul className="space-y-0.5 text-xs text-warning-foreground">
                {rows.flatMap((r, i) =>
                  r.flags.map((fl) => (
                    <li key={`${i}-${fl}`}>
                      ⚠ Satır {i + 1}: {fl}
                    </li>
                  )),
                )}
              </ul>
            )}
          </div>
        )}

        {rows && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Belgede okunabilir kayıt bulunamadı. Daha net bir ekran görüntüsü
            deneyin.
          </p>
        )}

        <DialogFooter>
          {imageDataUrl && !rows && (
            <Button variant="ghost" onClick={reset}>
              Sıfırla
            </Button>
          )}
          <Button
            onClick={() => void commit()}
            disabled={!rows || committing || busy}
          >
            {committing ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Ekleniyor…
              </>
            ) : (
              `Seçilenleri Ekle`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Sayfalara gömülen kompakt buton + dialog ikilisi. */
export function ImageImportButton(props: {
  targetType: ImportTarget;
  targetLabel: string;
  fieldOrder: string[];
  onCommit: (rows: Record<string, string | number | null>[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="mr-1 h-4 w-4 text-primary-strong" />
        Görselden Ekle
      </Button>
      <ImageImportDialog open={open} onOpenChange={setOpen} {...props} />
    </>
  );
}
