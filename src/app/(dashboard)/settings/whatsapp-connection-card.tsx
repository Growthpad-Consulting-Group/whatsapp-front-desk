"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { updateWhatsAppCredentialsAction } from "@/actions/business";
import type { Business } from "@/types";

interface Props {
  business: Business;
  isOwner: boolean;
}

export function WhatsAppConnectionCard({ business, isOwner }: Props) {
  const isConnected = !!(business.whatsapp_phone_number_id && business.whatsapp_access_token);

  const [phoneNumberId, setPhoneNumberId] = useState(business.whatsapp_phone_number_id ?? "");
  const [accessToken, setAccessToken]     = useState(business.whatsapp_access_token ?? "");
  const [showToken, setShowToken]         = useState(false);
  const [loading, setLoading]             = useState(false);
  const [editing, setEditing]             = useState(!isConnected);

  const handleSave = async () => {
    if (!phoneNumberId.trim() || !accessToken.trim()) {
      toast.error("Both Phone Number ID and Access Token are required.");
      return;
    }
    setLoading(true);
    const res = await updateWhatsAppCredentialsAction(phoneNumberId, accessToken);
    setLoading(false);
    if (res.success) {
      toast.success("WhatsApp credentials saved successfully.");
      setEditing(false);
    } else {
      toast.error(res.error ?? "Failed to save credentials.");
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    const res = await updateWhatsAppCredentialsAction("", "");
    setLoading(false);
    if (res.success) {
      setPhoneNumberId("");
      setAccessToken("");
      setEditing(true);
      toast.success("WhatsApp Business credentials disconnected.");
    } else {
      toast.error(res.error ?? "Failed to disconnect WhatsApp.");
    }
  };

  return (
    <div className="bg-card/60 dark:bg-slate-900/60 backdrop-blur-md border border-border/80 rounded-2xl p-6 space-y-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#128C7E] to-[#25D366] text-white shadow-md shadow-[#25D366]/15 flex items-center justify-center shrink-0">
            <Icon icon="mdi:whatsapp" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground leading-snug">WhatsApp Business API</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Connect your Meta-approved phone number to send and receive messages.
            </p>
          </div>
        </div>
        
        <span className={`self-start sm:self-center inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border shrink-0 transition-all duration-300 ${
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

      {/* Connected summary (non-edit mode) */}
      {isConnected && !editing && (
        <div className="space-y-3.5 text-xs bg-muted/20 border border-border/60 rounded-2xl p-4 transition-all duration-350">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-muted-foreground font-medium">Display number</span>
            <span className="font-extrabold text-foreground bg-card border border-border/60 px-2.5 py-1 rounded-lg shadow-2xs">
              {business.whatsapp_number || "—"}
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-muted-foreground font-medium">Phone Number ID</span>
            <span className="font-mono font-bold text-foreground bg-card border border-border/60 px-2.5 py-1 rounded-lg shadow-2xs">
              {phoneNumberId.slice(0, 6)}••••••{phoneNumberId.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-muted-foreground font-medium">Access Token</span>
            <span className="font-mono text-muted-foreground bg-card border border-border/60 px-2.5 py-1 rounded-lg shadow-2xs">
              ••••••••••••••••
            </span>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="space-y-4">
          <Input
            label="Phone Number ID"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="120364XXXXXXXXX"
            disabled={!isOwner}
            className="focus:ring-2 focus:ring-primary/20 transition-all duration-300"
          />
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Access Token</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAxxxxx..."
                disabled={!isOwner}
                className="h-10 w-full pl-3 pr-10 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-border/100 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon icon={showToken ? "solar:eye-closed-broken" : "solar:eye-broken"} className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 rounded-2xl px-4 py-3 flex items-start gap-2.5">
            <Icon icon="solar:info-circle-broken" className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Get these from <strong>Meta Business Manager → WhatsApp → API Setup</strong>. Always use a <strong>permanent system user token</strong> to prevent connection failures.
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
                Save Credentials
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setEditing(true)} className="border border-border/80 rounded-xl px-4 text-xs font-bold transition-all duration-300 hover:bg-muted/40">
                <Icon icon="solar:pen-2-broken" className="h-4 h-4 mr-1.5" />
                Update
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
