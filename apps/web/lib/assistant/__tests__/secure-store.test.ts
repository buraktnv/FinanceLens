import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "../secure-store";

// Not: Node/vitest ortamında window/indexedDB olmadığından modül
// "plain:" fallback'ine düşer; tarayıcıdaki AES-GCM yolu aynı arayüzü
// paylaşır ve manuel smoke ile doğrulanır.

describe("secure-store", () => {
  it("roundtrips a secret through the available backend", async () => {
    const enc = await encryptSecret("sk-test-123");
    expect(await decryptSecret(enc)).toBe("sk-test-123");
  });

  it("never stores plaintext outside the documented plain: fallback", async () => {
    const enc = await encryptSecret("sk-test-123");
    if (!enc.startsWith("plain:")) {
      expect(enc).not.toContain("sk-test-123");
      expect(enc.split(".")).toHaveLength(2); // iv.ciphertext base64 çifti
    }
  });

  it("handles null, garbage and plain-prefixed payloads", async () => {
    expect(await decryptSecret(null)).toBe("");
    expect(await decryptSecret("garbage!!")).toBe("");
    expect(await decryptSecret("plain:merhaba")).toBe("merhaba");
  });
});
