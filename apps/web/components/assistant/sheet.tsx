"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Settings2, SendHorizonal, Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { dashboardApi } from "@/lib/api";
import { detectIntent } from "@/lib/assistant/router";
import {
  buildReply,
  buildNarrationUserPrompt,
  parseLlmNarration,
  type ReplyBlock,
} from "@/lib/assistant/reply";
import { MASTER_SYSTEM_PROMPT } from "@/lib/assistant/prompts";
import {
  eventsToContext,
  retrieveHistory,
  retrieveKnowledge,
} from "@/lib/assistant/history/knowledge";
import {
  parseTransactionFromLlm,
  type PendingTxn,
  type TxnKind,
} from "@/lib/assistant/transaction-parse";
import { stocksApi, etfsApi, goldApi, silverApi, eurobondsApi, cashApi, incomesApi } from "@/lib/api";
import { trEvents } from "@/lib/assistant/history/tr";
import { usEvents } from "@/lib/assistant/history/us";
import { globalEvents } from "@/lib/assistant/history/global";
import type { HistoryEvent } from "@/lib/assistant/history/matcher";
import { useAssistant } from "./provider";
import { ProjectionCard } from "./projection-card";
import { HistoryFactsCard } from "./message-cards";
import { AssistantSettingsDialog } from "./settings-dialog";

const ALL_EVENTS: HistoryEvent[] = [...trEvents, ...usEvents, ...globalEvents];

const QUICK_REPLIES = [
  "Ne zaman özgür olurum?",
  "5 adet Apple aldım $105.5",
  "Ayda 15k biriktirirsem?",
  "2008 gibi bir kriz olsaydı?",
];

const TXN_EXTRACTION_PROMPT =
  'Kullanicinin cumlesini finansal islem olarak ayristir. Yalnizca su JSON\'u don: ' +
  '{"kind":"stock|gold|silver|eurobond|cash|income","name":"varlik adi","symbol":"borsa kodu (emin degilsen null)","quantity":sayi|null,"price":birim fiyat veya tutar|null,"currency":"USD|EUR|GBP|TRY"}. ' +
  "Sayilari birebir aktar; sembol yaygin bilinen bir sirketse yaz, degilse null birak; tahmin etme.";

async function commitTxn(txn: PendingTxn): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  switch (txn.kind) {
    case "stock": {
      const symbol = txn.symbol ?? txn.name.toUpperCase().replace(/\s+/g, "");
      await stocksApi.create({
        symbol,
        name: txn.name,
        quantity: Number(txn.quantity ?? 0),
        purchasePrice: Number(txn.price ?? 0),
        currency: txn.currency,
        purchaseDate: today,
      });
      return `Eklendi: ${symbol} x ${txn.quantity ?? 0} @ ${txn.price ?? "?"} ${txn.currency}`;
    }
    case "etf": {
      await etfsApi.create({
        symbol:
          txn.symbol ?? txn.name.toUpperCase().replace(/s+/g, ""),
        name: txn.name,
        quantity: Number(txn.quantity ?? 0),
        purchasePrice: Number(txn.price ?? 0),
        currency: txn.currency,
        purchaseDate: today,
      });
      return `Eklendi: ${txn.symbol ?? txn.name} x ${txn.quantity ?? 0}`;
    }
    case "gold":
    case "silver": {
      const api = txn.kind === "gold" ? goldApi : silverApi;
      await api.create({
        name: txn.name,
        quantity: Number(txn.quantity ?? 0),
        purchasePrice: Number(txn.price ?? 0),
        purchaseDate: today,
      });
      return `Eklendi: ${txn.name} ${txn.quantity ?? 0} gram`;
    }
    case "eurobond": {
      if (!txn.symbol && !txn.name) throw new Error("Tahvil adi gerekli");
      await eurobondsApi.create({
        name: txn.name,
        faceValue: Number(txn.price ?? 1000),
        purchasePrice: Number(txn.price ?? 1000),
        quantity: Number(txn.quantity ?? 1),
        couponRate: 0,
        currency: txn.currency,
        purchaseDate: today,
        maturityDate: new Date(Date.now() + 5 * 365.25 * 86400000)
          .toISOString()
          .slice(0, 10),
      });
      return `Eklendi: ${txn.name} x ${txn.quantity ?? 1}`;
    }
    case "cash": {
      await cashApi.create({
        accountName: txn.name,
        balance: Number(txn.price ?? txn.quantity ?? 0),
        currency: txn.currency,
      });
      return `Hesap eklendi: ${txn.name}`;
    }
    case "income": {
      await incomesApi.create({
        type: "OTHER",
        description: txn.name,
        amount: Number(txn.price ?? txn.quantity ?? 0),
        currency: txn.currency,
        date: today,
      });
      return `Gelir eklendi: ${txn.name} ${txn.price ?? ""} ${txn.currency}`.trim();
    }
  }
}

function invalidateForKind(kind: TxnKind, queryClient: ReturnType<typeof useQueryClient>) {
  const map: Record<TxnKind, string[][]> = {
    stock: [["stocks"], ["stocks", "summary"]],
    etf: [["etfs"], ["etfs", "summary"]],
    gold: [["gold"]],
    silver: [["silver"]],
    eurobond: [["eurobonds"], ["eurobonds", "summary"]],
    cash: [["cash"], ["cash", "summary"]],
    income: [["incomes"], ["incomes", "summary"]],
  };
  for (const key of map[kind]) {
    void queryClient.invalidateQueries({ queryKey: key });
  }
  void queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
}

interface ChatMessage {
  role: "user" | "assistant";
  text?: string;
  blocks?: ReplyBlock[];
}

export function AssistantSheet() {
  const { open, setOpen, settings } = useAssistant();
  const queryClient = useQueryClient();
  const [symbolEdits, setSymbolEdits] = useState<Record<string, string>>({});
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: overview } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: dashboardApi.getOverview,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  const snapshot = overview
    ? {
        netWorthTRY: overview.netWorth ?? 0,
        monthlySavings: overview.monthly?.savings ?? 0,
        monthlyExpenses: overview.monthly?.expenses ?? 0,
      }
    : null;

  async function handleConfirm(txn: PendingTxn, key: string) {
    setConfirmBusy(true);
    try {
      const finalTxn: PendingTxn = {
        ...txn,
        symbol:
          txn.kind === "stock"
            ? (symbolEdits[key] ?? txn.symbol ?? txn.name.toUpperCase().replace(/\s+/g, ""))
            : txn.symbol,
      };
      const note = await commitTxn(finalTxn);
      invalidateForKind(txn.kind, queryClient);
      setDoneKeys((prev) => new Set(prev).add(key));
      setMessages((m) => [...m, { role: "assistant", text: note }]);
    } catch {
      toast.error("Kayıt eklenemedi; alanları kontrol et");
    } finally {
      setConfirmBusy(false);
    }
  }

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || busy || !snapshot) return;

    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setBusy(true);

      try {
        const intent = detectIntent(question);
        const blocks = buildReply(intent, snapshot, settings, ALL_EVENTS);

        // add-transaction + anahtar: cumleyi LLM ile daha iyi ayristir.
        if (intent.kind === "add-transaction" && settings.apiKey) {
          try {
            const res = await fetch("/api/assistant", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-assistant-key": settings.apiKey,
              },
              body: JSON.stringify({
                provider: settings.provider,
                model: settings.model,
                systemPrompt: TXN_EXTRACTION_PROMPT,
                userPrompt: `Kullanıcının cümlesi: "${question}"`,
              }),
            });
            if (res.ok) {
              const json = (await res.json()) as { reply?: string };
              const txn = json.reply ? parseTransactionFromLlm(json.reply) : null;
              if (txn) {
                setMessages((m) => [
                  ...m,
                  {
                    role: "assistant",
                    blocks: [
                      {
                        type: "text",
                        text: "Şu kaydı anladım; onaylarsan ekliyorum.",
                      },
                      { type: "confirm", txn },
                    ],
                  },
                ]);
                return;
              }
            }
          } catch {
            // LLM yolunu düş — yerel parser zaten blokları kurdu.
          }
        }

        // Derin RAG: soruyu eş anlamlı kökleriyle genişletip hem bilgi
        // tabanını hem tüm tarihsel olayları tarar.
        const historyMatches = blocks.find((b) => b.type === "history");
        const ragChunks = retrieveKnowledge(question);
        const ragEvents =
          historyMatches && historyMatches.type === "history"
            ? historyMatches.events
            : retrieveHistory(question, ALL_EVENTS);
        const ragContext = [
          ...ragChunks.map((c) => `${c.title}: ${c.text}`),
          ...(ragEvents.length > 0 ? [eventsToContext(ragEvents)] : []),
        ];

        if (settings.apiKey) {
          try {
            const res = await fetch("/api/assistant", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-assistant-key": settings.apiKey,
              },
              body: JSON.stringify({
                provider: settings.provider,
                model: settings.model,
                systemPrompt: MASTER_SYSTEM_PROMPT,
                userPrompt: buildNarrationUserPrompt(question, blocks, ragContext),
              }),
            });
            if (res.ok) {
              const json = (await res.json()) as { reply?: string };
              if (json.reply) {
                // Structured narration: summary + points first, graphics after.
                const { summary, points } = parseLlmNarration(json.reply);
                const graphicBlocks = blocks.filter((b) => b.type !== "text");
                setMessages((m) => [
                  ...m,
                  { role: "assistant", blocks: [{ type: "text", text: summary, points }, ...graphicBlocks] },
                ]);
                return;
              }
            }
          } catch {
            // LLM unavailable — rule-based blocks below are still shown.
          }
        }

        setMessages((m) => [...m, { role: "assistant", blocks }]);
      } finally {
        setBusy(false);
      }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary-strong" />
              Finans Asistanı
            </SheetTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Asistan ayarları"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Asistanı kapat"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="rounded-lg bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">
                Merhaba! Durumunuza göre finansal özgürlük projeksiyonunuzu
                hesaplayabilirim. Aşağıdaki hızlı sorulardan birini seçin ya da
                kendi sorunuzu yazın.
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "text-right" : ""}>
                {msg.role === "user" ? (
                  <span className="inline-block max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-1.5 text-left text-sm font-medium text-primary-foreground">
                    {msg.text}
                  </span>
                ) : (
                  <div className="space-y-2">
                    {msg.blocks?.map((block, j) =>
                      block.type === "text" ? (
                        <div
                          key={j}
                          className="inline-block max-w-[92%] rounded-2xl rounded-bl-sm border bg-card px-3 py-2 text-left"
                        >
                          <p className="whitespace-pre-line text-sm leading-relaxed">
                            {block.text}
                          </p>
                          {block.points && block.points.length > 0 && (
                            <ul className="mt-1.5 space-y-1 border-t pt-1.5">
                              {block.points.map((point, k) => (
                                <li
                                  key={k}
                                  className="flex gap-1.5 text-xs leading-relaxed text-muted-foreground"
                                >
                                  <span
                                    aria-hidden="true"
                                    className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary-strong"
                                  />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : block.type === "projection" ? (
                        <ProjectionCard
                          key={j}
                          result={block.result}
                          compare={"compare" in block ? block.compare : undefined}
                          compareLabel={"compareLabel" in block ? block.compareLabel : undefined}
                        />
                      ) : block.type === "confirm" ? (
                        <div
                          key={j}
                          className="max-w-[92%] rounded-2xl rounded-bl-sm border bg-card p-3 text-left"
                        >
                          <p className="mb-2 text-sm font-medium">İşlem özeti</p>
                          <ul className="space-y-1 text-xs">
                            {(
                              [
                                ["Tür", block.txn.kind],
                                ["Varlık", block.txn.name],
                                [
                                  "Sembol",
                                  block.txn.symbol ?? "(doldur)",
                                ],
                                ["Adet", block.txn.quantity ?? "?"],
                                ["Fiyat", block.txn.price ?? "?"],
                                ["Para birimi", block.txn.currency],
                              ] as const
                            ).map(([k, v]) => (
                              <li key={k} className="flex justify-between gap-3">
                                <span className="text-muted-foreground">{k}</span>
                                {k === "Sembol" && !block.txn.symbol ? (
                                  <Input
                                    value={
                                      symbolEdits[`${i}-${j}`] ??
                                      ""
                                    }
                                    onChange={(e) =>
                                      setSymbolEdits((prev) => ({
                                        ...prev,
                                        [`${i}-${j}`]: e.target.value.toUpperCase(),
                                      }))
                                    }
                                    aria-label="Borsa kodu"
                                    placeholder="AAPL"
                                    className="h-6 w-28 text-right text-xs tabular-nums"
                                  />
                                ) : (
                                  <span className="font-medium tabular-nums">
                                    {typeof v === "number"
                                      ? v.toLocaleString("tr-TR")
                                      : v}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                          {doneKeys.has(`${i}-${j}`) ? (
                            <p className="mt-2 text-xs font-medium text-success">
                              Kayıt eklendi.
                            </p>
                          ) : (
                            <div className="mt-2 flex gap-2">
                              <Button
                                size="sm"
                                disabled={confirmBusy}
                                onClick={() =>
                                  void handleConfirm(block.txn, `${i}-${j}`)
                                }
                              >
                                {confirmBusy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Onayla ve Ekle"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={confirmBusy}
                                onClick={() =>
                                  setDoneKeys((prev) => new Set(prev).add(`${i}-${j}`))
                                }
                              >
                                Vazgeç
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <HistoryFactsCard key={j} intro={block.intro} events={block.events} />
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary-strong" />
                Hesaplıyorum…
              </div>
            )}
          </div>

          <div className="border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={busy || !snapshot}
                  onClick={() => void send(q)}
                  className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary-strong disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={snapshot ? "Bir şey sor…" : "Veriler yükleniyor…"}
                aria-label="Asistana soru yaz"
                disabled={busy || !snapshot}
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Gönder"
                disabled={busy || !snapshot || !input.trim()}
              >
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-1.5 text-center text-[10px] leading-tight text-muted-foreground">
              Projeksiyonlar varsayımlarınıza dayanır; yatırım tavsiyesi değildir.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      <AssistantSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
