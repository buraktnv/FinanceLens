/** Görsel içe aktarma için istemci tarafı ön işleme. */

export interface ProcessedImage {
  dataUrl: string;
  width: number;
  height: number;
}

const MAX_DIMENSION = 2048;
const TARGET_QUALITY = 0.85;
const MIN_QUALITY = 0.3;

/**
 * Dosyayı JPEG'e çevirir, uzun kenarı 2048px'e indirir ve boyut limitine
 * kadar kaliteyi kademeli düşürür. Vision modelleri ve OCR için ideal girdi.
 */
export async function processImageFile(
  file: File | Blob,
  maxBytes = 2_500_000,
): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D baglami alinamadi");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  let quality = TARGET_QUALITY;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length * 0.75 > maxBytes && quality > MIN_QUALITY) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  return { dataUrl, width, height };
}
