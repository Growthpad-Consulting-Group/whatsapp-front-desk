import crypto from "crypto";

const SECRET =
  process.env.ENCRYPTION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "default-fallback-encryption-secret-key-32-chars-long";

const ALGORITHM = "aes-256-cbc";
const KEY = crypto.scryptSync(SECRET, "salt", 32);
const IV_LENGTH = 16;

/**
 * Encrypts clear text using AES-256-CBC.
 * Returns the format `ivHex:encryptedHex`.
 */
export function encryptText(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a string in the format `ivHex:encryptedHex` using AES-256-CBC.
 * If the formatting is invalid or decryption fails, returns the raw input text.
 */
export function decryptText(text: string): string {
  if (!text) return "";
  const parts = text.split(":");
  if (parts.length !== 2) {
    // Non-encrypted text format: return as-is (provides backwards compatibility)
    return text;
  }

  try {
    const iv = Buffer.from(parts[0], "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(parts[1], "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.warn("[Crypto Decryption Warn] Failed to decrypt value. Returning original text.", err);
    return text;
  }
}
