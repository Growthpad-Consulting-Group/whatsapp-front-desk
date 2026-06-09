import type { MessagingProvider } from "@/types";

export class WhatsAppCloudProvider implements MessagingProvider {
  private phoneNumberId: string;
  private accessToken: string;
  private isMock: boolean;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
    
    // Treat as mock if environment keys are missing or contain placeholder text
    this.isMock =
      !this.phoneNumberId ||
      !this.accessToken ||
      this.phoneNumberId.includes("your-phone-number-id") ||
      this.accessToken.includes("your-access-token");
  }

  async sendText(to: string, body: string): Promise<{ messageId: string }> {
    const cleanTo = this.normalizePhone(to);

    if (this.isMock) {
      console.log(`[MOCK WHATSAPP OUTBOUND] Text to ${cleanTo}: "${body}"`);
      return { messageId: `mock-wamid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanTo,
            type: "text",
            text: { body },
          }),
        }
      );

      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.error?.message || "Failed to send WhatsApp message");
      }

      const messageId = resJson.messages?.[0]?.id;
      if (!messageId) {
        throw new Error("Invalid response format from WhatsApp API");
      }

      return { messageId };
    } catch (error: any) {
      console.error("[WhatsApp client error]", error.message);
      // Fail gracefully in local env if request fails (e.g. network issue)
      if (process.env.NODE_ENV === "development") {
        console.warn("[Development mode] Falling back to mock ID due to Meta API failure.");
        return { messageId: `fallback-wamid-${Date.now()}` };
      }
      throw error;
    }
  }

  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    components: any[] = []
  ): Promise<{ messageId: string }> {
    const cleanTo = this.normalizePhone(to);

    if (this.isMock) {
      console.log(
        `[MOCK WHATSAPP OUTBOUND] Template "${templateName}" (${languageCode}) to ${cleanTo} with components:`,
        JSON.stringify(components)
      );
      return { messageId: `mock-wamid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanTo,
            type: "template",
            template: {
              name: templateName,
              language: { code: languageCode },
              components,
            },
          }),
        }
      );

      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.error?.message || "Failed to send WhatsApp template");
      }

      const messageId = resJson.messages?.[0]?.id;
      if (!messageId) {
        throw new Error("Invalid response format from WhatsApp API");
      }

      return { messageId };
    } catch (error: any) {
      console.error("[WhatsApp template error]", error.message);
      if (process.env.NODE_ENV === "development") {
        console.warn("[Development mode] Falling back to mock ID due to Meta API failure.");
        return { messageId: `fallback-wamid-${Date.now()}` };
      }
      throw error;
    }
  }

  private normalizePhone(phone: string): string {
    // Keep only numeric characters (must not have + for Meta API send target parameter)
    return phone.replace(/\D/g, "");
  }
}

// Export singleton instance
export const whatsappClient = new WhatsAppCloudProvider();
