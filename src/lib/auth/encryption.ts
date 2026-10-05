import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }
  return Buffer.from(key, "base64");
}

/**
 * Encrypt a string with AES-256-GCM.
 * Returns: base64(iv + ciphertext + authTag)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // iv (12) + encrypted (variable) + tag (16)
  return Buffer.concat([iv, encrypted, tag]).toString("base64");
}

/**
 * Decrypt a string encrypted with AES-256-GCM.
 * Input: base64(iv + ciphertext + authTag)
 */
export function decrypt(encryptedBase64: string): string {
  const key = getKey();
  const data = Buffer.from(encryptedBase64, "base64");

  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(data.length - TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH, data.length - TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(ciphertext) + decipher.final("utf8");
}

// ─── Content fields (question text, answer excerpts) ───────

export const ENCRYPTED_FIELD_PREFIX = "enc:v1:";

/** Whether a stored field value is already encrypted with encryptField(). */
export function isEncryptedField(value: string): boolean {
  return value.startsWith(ENCRYPTED_FIELD_PREFIX);
}

/** Encrypt a content field for storage, tagged so it can be told apart from legacy plaintext. */
export function encryptField(plaintext: string): string;
export function encryptField(plaintext: string | null): string | null;
export function encryptField(plaintext: string | null): string | null {
  if (plaintext === null) return null;
  return ENCRYPTED_FIELD_PREFIX + encrypt(plaintext);
}

/**
 * Decrypt a content field. Values without the prefix are legacy plaintext rows
 * written before encryption was introduced and are returned unchanged.
 */
export function decryptField(value: string): string;
export function decryptField(value: string | null): string | null;
export function decryptField(value: string | null): string | null {
  if (value === null || !isEncryptedField(value)) return value;
  return decrypt(value.slice(ENCRYPTED_FIELD_PREFIX.length));
}
