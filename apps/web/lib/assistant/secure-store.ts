/**
 * Cihaza bağlı gizli-depo: API anahtarı AES-GCM ile şifrelenip localStorage'a
 * yazılır; anahtar malzemesi IndexedDB'de extractable-OLMAYAN bir CryptoKey
 * olarak tutulur. Böylece localStorage içeriği tek başına başka cihazda
 * çözülemez ve ham anahtar hiçbir okunabilir biçimde durmaz.
 *
 * Sınırlar (dürüst olalım): sayfa bağlamında çalışan bir saldırgan decrypt
 * fonksiyonunu da çağırabilir; buradaki şifreleme XSS'e karşı değil, depolama
 * sızıntısı ve görsel denetimlere karşı ek bir katmandır. Asıl kontrol,
 * sağlayıcı tarafındaki harcama limitidir.
 */

const DB_NAME = "financelens-assistant";
const STORE_NAME = "keys";
const DEVICE_KEY_ID = "device-aes-gcm";
const PLAIN_PREFIX = "plain:";

let cachedDeviceKey: CryptoKey | null = null;

function hasCryptoSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.indexedDB !== "undefined" &&
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined"
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB acilamadi"));
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB okuma hatasi"));
  });
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("IndexedDB yazma hatasi"));
  });
}

/** Extractable olmayan cihaz anahtarı: ilk kullanımda üretilir. */
async function getDeviceKey(): Promise<CryptoKey> {
  if (cachedDeviceKey) return cachedDeviceKey;

  const db = await openDb();
  const existing = (await idbGet(db, DEVICE_KEY_ID)) as CryptoKey | undefined;
  if (existing instanceof CryptoKey) {
    cachedDeviceKey = existing;
    return existing;
  }

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false, // extractable: false — ham anahtar dışarı çıkarılamaz
    ["encrypt", "decrypt"],
  );
  await idbPut(db, DEVICE_KEY_ID, key);
  cachedDeviceKey = key;
  return key;
}

function bufferToB64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function b64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Metni AES-GCM ile şifreler; dönen değer "iv.ciphertext" base64 çiftidir.
 * Kripto altyapısı yoksa (çok eski tarayıcı) "plain:" önekli düz metne düşer.
 */
export async function encryptSecret(plain: string): Promise<string> {
  if (!hasCryptoSupport()) return PLAIN_PREFIX + plain;

  try {
    const key = await getDeviceKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plain),
    );
    return `${bufferToB64(iv)}.${bufferToB64(ciphertext)}`;
  } catch {
    return PLAIN_PREFIX + plain;
  }
}

/** encryptSecret ile üretilmiş değeri çözer; başarısızlıkta boş döner. */
export async function decryptSecret(payload: string | null): Promise<string> {
  if (!payload) return "";

  if (payload.startsWith(PLAIN_PREFIX)) {
    return payload.slice(PLAIN_PREFIX.length);
  }

  if (!hasCryptoSupport()) return "";

  try {
    const [ivB64, dataB64] = payload.split(".");
    if (!ivB64 || !dataB64) return "";

    const key = await getDeviceKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBuffer(ivB64) as BufferSource },
      key,
      b64ToBuffer(dataB64) as BufferSource,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    // Yanlış cihaz, bozuk veri veya değiştirilmiş ciphertext.
    return "";
  }
}
