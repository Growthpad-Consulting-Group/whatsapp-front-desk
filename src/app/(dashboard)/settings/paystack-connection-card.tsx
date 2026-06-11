"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { updatePaystackCredentialsAction } from "@/actions/business";
import type { Business } from "@/types";

interface Props {
  business: Business;
  isOwner: boolean;
}

export function PaystackConnectionCard({ business, isOwner }: Props) {
  const isConnected = !!business.paystack_secret_key;

  const [secretKey, setSecretKey] = useState(business.paystack_secret_key ?? "");
  const [showKey, setShowKey]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [editing, setEditing]     = useState(!isConnected);

  const handleSave = async () => {
    if (!secretKey.trim()) {
      toast.error("Secret Key is required.");
      return;
    }
    if (!secretKey.startsWith("sk_")) {
      toast.error("Invalid key — Paystack secret keys start with sk_live_ or sk_test_.");
      return;
    }
    setLoading(true);
    const res = await updatePaystackCredentialsAction(secretKey);
    setLoading(false);
    if (res.success) {
      toast.success("Paystack connected successfully.");
      setEditing(false);
    } else {
      toast.error(res.error ?? "Failed to save credentials.");
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    const res = await updatePaystackCredentialsAction("");
    setLoading(false);
    if (res.success) {
      setSecretKey("");
      setEditing(true);
      toast.success("Paystack disconnected.");
    } else {
      toast.error(res.error ?? "Failed to disconnect Paystack.");
    }
  };

  return (
    <div className="bg-card/60 dark:bg-slate-900/60 backdrop-blur-md border border-border/80 rounded-2xl p-6 space-y-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00C3F7] to-[#0BA4DB] text-white shadow-md shadow-[#0BA4DB]/15 flex items-center justify-center shrink-0">
            <Icon icon="solar:dollar-minimalistic-broken" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground leading-snug">Paystack Payments</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Accept deposits and invoice payments directly into your Paystack account.
            </p>
          </div>
        </div>

        <span className={`self-start sm:self-center inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border shrink-0 transition-all duration-300 ${
          isConnected
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 text-emerald-600 dark:text-emerald-400"
            : "bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 text-amber-600 dark:text-amber-400 animate-pulse"
        }`}>
          {isConnected ? (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          )}
          {isConnected ? "Connected" : "Not connected"}
        </span>
      </div>

      {/* Connected summary */}
      {isConnected && !editing && (
        <div className="space-y-3.5 text-xs bg-muted/20 border border-border/60 rounded-2xl p-4">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-muted-foreground font-medium">Secret Key</span>
            <span className="font-mono font-bold text-foreground bg-card border border-border/60 px-2.5 py-1 rounded-lg shadow-2xs">
              {secretKey.slice(0, 10)}••••••{secretKey.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-muted-foreground font-medium">Mode</span>
            <span className={`font-bold px-2.5 py-1 rounded-lg border text-xs ${
              secretKey.startsWith("sk_live_")
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 text-amber-600 dark:text-amber-400"
            }`}>
              {secretKey.startsWith("sk_live_") ? "Live" : "Test"}
            </span>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Secret Key</label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_live_xxxxxxxxx or sk_test_xxxxxxxxx"
                disabled={!isOwner}
                className="h-10 w-full pl-3 pr-10 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-border/100 disabled:opacity-50 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon icon={showKey ? "solar:eye-closed-broken" : "solar:eye-broken"} className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/40 rounded-2xl px-4 py-3 flex items-start gap-2.5">
            <Icon icon="solar:info-circle-broken" className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              Find your Secret Key at <strong>Paystack Dashboard → Settings → API Keys & Webhooks</strong>.
              Use <strong>sk_live_</strong> for real payments. Your webhook URL is:
              <br />
              <code className="mt-1 inline-block bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-xs font-mono break-all">
                {process.env.NEXT_PUBLIC_APP_URL ?? "https://your-app.com"}/api/webhooks/paystack
              </code>
            </p>
          </div>
        </div>
      )}

      {/* Footer actions */}
      {isOwner && (
        <div className="flex items-center gap-2.5 pt-1">
          {editing ? (
            <>
              {isConnected && (
                <Button variant="ghost" onClick={() => setEditing(false)} disabled={loading} className="border border-border/80 rounded-xl px-4 text-xs font-bold transition-all duration-300">
                  Cancel
                </Button>
              )}
              <Button onClick={handleSave} loading={loading} className="rounded-xl px-4 text-xs font-bold transition-all duration-300">
                Connect Paystack
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setEditing(true)} className="border border-border/80 rounded-xl px-4 text-xs font-bold transition-all duration-300 hover:bg-muted/40">
                <Icon icon="solar:pen-2-broken" className="h-4 w-4 mr-1.5" />
                Update Key
              </Button>
              <Button variant="destructive" onClick={handleDisconnect} loading={loading} className="rounded-xl px-4 text-xs font-bold transition-all duration-300">
                Disconnect
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
