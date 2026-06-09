import crypto from "crypto";
import type { PaymentProvider, InitializeTransactionParams, InitializeTransactionResult } from "./provider";

export class PaystackProvider implements PaymentProvider {
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || "";
  }

  async initializeTransaction(params: InitializeTransactionParams): Promise<InitializeTransactionResult> {
    if (!this.secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured in environment variables.");
    }

    // Paystack expects amount in subunits (e.g. cents for KES/USD/NGN)
    const amountInSubunits = Math.round(params.amount * 100);

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        amount: amountInSubunits,
        currency: params.currency.toUpperCase(),
        reference: params.reference,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
      }),
    });

    const resJson = await response.json();

    if (!response.ok || !resJson.status) {
      throw new Error(resJson.message || "Paystack transaction initialization failed");
    }

    return {
      authorizationUrl: resJson.data.authorization_url,
      reference: resJson.data.reference,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.secretKey || !signature) return false;
    
    const hash = crypto
      .createHmac("sha512", this.secretKey)
      .update(rawBody)
      .digest("hex");
      
    return hash === signature;
  }
}

export const paystackProvider = new PaystackProvider();
