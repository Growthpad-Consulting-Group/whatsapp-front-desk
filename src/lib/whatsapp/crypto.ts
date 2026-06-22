import crypto from "crypto";

/**
 * Validates the X-Hub-Signature-256 header sent by Meta.
 * HMAC SHA-256 computed over the raw request body with the App Secret.
 */
export async function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  // If no app secret is configured, bypass signature check in development
  if (!appSecret) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[WARNING] WHATSAPP_APP_SECRET is not configured in env. Webhook signature check is bypassed."
      );
      return true;
    }
    console.error("WHATSAPP_APP_SECRET is missing. Cannot verify webhook signature.");
    return false;
  }

  if (!signatureHeader) {
    return false;
  }

  // Signature header format: sha256=abcdef1234...
  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") {
    return false;
  }

  const expectedSignature = parts[1];
  const computedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  console.log("[crypto] expected:", expectedSignature, "computed:", computedSignature, "body_len:", rawBody.length);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(computedSignature, "hex")
    );
  } catch {
    return false;
  }
}
