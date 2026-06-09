"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { createPaymentLinkAction } from "@/actions/payments";

interface PayButtonProps {
  invoiceId: string;
  amount: number;
  currency: string;
}

export function PayButton({ invoiceId, amount, currency }: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await createPaymentLinkAction(null, invoiceId, amount, currency);
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        setError(res.error ?? "Payment failed. Please try again.");
        setLoading(false);
      }
    } catch (e: any) {
      setError(e?.message ?? "Unexpected error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-2">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground hover:opacity-95 transition-all cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Icon icon="solar:card-broken" className="h-4 w-4" />
            Pay with Paystack
          </>
        )}
      </button>
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <Icon icon="solar:danger-triangle-broken" className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
