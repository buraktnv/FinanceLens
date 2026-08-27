"use client";

/**
 * Hibrit OCR: Tesseract.js tarayıcıda çalışır (ücretsiz, anahtarsız).
 * Worker tekil tutulur; dil verisi CDN'den gelir (ilk kullanımda iner).
 */

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

async function getWorker(): Promise<import("tesseract.js").Worker> {
  if (!workerPromise) {
    workerPromise = import("tesseract.js").then((Tesseract) =>
      Tesseract.createWorker("tur+eng", 1, {
        logger: () => {
          /* progress UI'ya bağlanmadı; sessiz */
        },
      }),
    );
  }
  return workerPromise;
}

export async function runOcr(dataUrl: string): Promise<string> {
  const worker = await getWorker();
  const { data } = await worker.recognize(dataUrl);
  return data.text ?? "";
}
