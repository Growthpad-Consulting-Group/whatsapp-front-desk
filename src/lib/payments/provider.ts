export interface InitializeTransactionParams {
  email: string;
  amount: number; // in lowest currency unit (e.g. cents/kobo/shilling cents)
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}

export interface InitializeTransactionResult {
  authorizationUrl: string;
  reference: string;
}

export interface PaymentProvider {
  initializeTransaction(params: InitializeTransactionParams): Promise<InitializeTransactionResult>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}

export async function getPaymentProvider(providerName: string = "paystack"): Promise<PaymentProvider> {
  if (providerName === "paystack") {
    const { paystackProvider } = await import("./paystack");
    return paystackProvider;
  }
  throw new Error(`Unsupported payment provider: ${providerName}`);
}
