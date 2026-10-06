import { describe, expect, it } from "vitest";

import {
  ENCRYPTED_FIELD_PREFIX,
  decrypt,
  decryptField,
  encrypt,
  encryptField,
  isEncryptedField,
} from "@/lib/auth/encryption";

describe("encrypt / decrypt (Notion token)", () => {
  it("round-trips UTF-8 text", () => {
    const secret = "ntn_secret_token_é_🚀";
    expect(decrypt(encrypt(secret))).toBe(secret);
  });

  it("uses a random IV so the same input never yields the same ciphertext", () => {
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });

  it("rejects tampered ciphertext (GCM auth tag)", () => {
    const data = Buffer.from(encrypt("token"), "base64");
    data[data.length - 20]! ^= 0xff;
    expect(() => decrypt(data.toString("base64"))).toThrow();
  });

  it("fails loudly when ENCRYPTION_KEY is missing", () => {
    const key = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    try {
      expect(() => encrypt("x")).toThrow(/ENCRYPTION_KEY/);
    } finally {
      process.env.ENCRYPTION_KEY = key;
    }
  });
});

describe("encryptField / decryptField (question content)", () => {
  it("tags ciphertext with the prefix and hides the plaintext", () => {
    const value = encryptField("Quelle est la capitale de l'Australie ?");
    expect(value.startsWith(ENCRYPTED_FIELD_PREFIX)).toBe(true);
    expect(value).not.toContain("Australie");
    expect(isEncryptedField(value)).toBe(true);
  });

  it("round-trips, including HTML-ish characters", () => {
    const text = "<b>Canberra</b> & pas Sydney — ✓";
    expect(decryptField(encryptField(text))).toBe(text);
  });

  it("returns legacy plaintext rows unchanged", () => {
    expect(isEncryptedField("legacy question")).toBe(false);
    expect(decryptField("legacy question")).toBe("legacy question");
  });

  it("passes null through", () => {
    expect(encryptField(null)).toBeNull();
    expect(decryptField(null)).toBeNull();
  });
});
