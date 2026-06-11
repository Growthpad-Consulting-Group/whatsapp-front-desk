"use client";

import { useState, useTransition } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { updateBotPersonaAction } from "@/actions/business";

type Tone = "warm" | "professional" | "casual";

const TONES: {
  value: Tone;
  label: string;
  icon: string;
  tagline: string;
  preview: string;
}[] = [
  {
    value: "warm",
    label: "Warm & Friendly",
    icon: "solar:sun-broken",
    tagline: "Approachable, emoji-friendly, feels human",
    preview: "Hi Sarah! Welcome to Glow Studio ✨\n\nSo glad you reached out! Here are our services — just reply with a number and we'll get you booked in:\n\n1. Deep Tissue Massage (60 mins · KES 3,500)\n2. Swedish Massage (45 mins · KES 2,800)",
  },
  {
    value: "professional",
    label: "Professional",
    icon: "solar:buildings-2-broken",
    tagline: "Polished, concise, business-like",
    preview: "Good day, Sarah. Thank you for contacting Glow Studio.\n\nPlease select a service to proceed with your booking:\n\n1. Deep Tissue Massage (60 mins · KES 3,500)\n2. Swedish Massage (45 mins · KES 2,800)",
  },
  {
    value: "casual",
    label: "Casual & Fun",
    icon: "solar:smile-circle-broken",
    tagline: "Laid-back, conversational, playful",
    preview: "Hey Sarah! 👋 You've reached Glow Studio — let's get you sorted!\n\nPick a vibe:\n\n1. Deep Tissue Massage (60 mins · KES 3,500)\n2. Swedish Massage (45 mins · KES 2,800)",
  },
];

export function BotPersonaForm({
  botName,
  botTone,
  isOwner,
}: {
  botName: string;
  botTone: string;
  isOwner: boolean;
}) {
  const [name, setName] = useState(botName);
  const [tone, setTone] = useState<Tone>((botTone as Tone) || "warm");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedTone = TONES.find((t) => t.value === tone) ?? TONES[0];

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateBotPersonaAction(name, tone);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Bot Name */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Icon icon="solar:robot-broken" className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">Bot Name</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          The name your bot uses to identify itself to clients. Keep it short and memorable.
        </p>
        <div className="flex items-center gap-3 max-w-sm">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isOwner}
            maxLength={32}
            placeholder="e.g. Ava, Alex, Front Desk"
            className="flex-1 h-10 rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Preview: <span className="font-semibold text-foreground">&ldquo;Hi! I&apos;m {name || "Front Desk"}, your virtual assistant at [Business Name].&rdquo;</span>
        </p>
      </div>

      {/* Tone Selector */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Icon icon="solar:chat-square-broken" className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">Communication Tone</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Choose how the bot talks to your clients. This affects the greeting, slot confirmations, and follow-up messages.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              disabled={!isOwner}
              onClick={() => setTone(t.value)}
              className={cn(
                "group relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
                tone === t.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-background hover:border-primary/40 hover:bg-muted/40"
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  tone === t.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:text-primary"
                )}>
                  <Icon icon={t.icon} className="h-4 w-4" />
                </div>
                {tone === t.value && (
                  <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <p className={cn("text-xs font-bold", tone === t.value ? "text-primary" : "text-foreground")}>
                  {t.label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.tagline}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Live preview */}
        <div className="rounded-2xl bg-muted/30 border border-border/50 p-4 space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Icon icon="solar:eye-broken" className="h-3.5 w-3.5" />
            Preview — Initial greeting
          </p>
          <div className="bg-background border border-border/60 rounded-xl p-3.5">
            <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-mono">
              {selectedTone.preview}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Actual messages use your real business name, client names, and live service catalogue.
          </p>
        </div>
      </div>

      {/* Save */}
      {isOwner && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 active:scale-99 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <Icon icon="solar:refresh-broken" className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Icon icon="solar:check-circle-broken" className="h-4 w-4" />
            ) : (
              <Icon icon="solar:disk-broken" className="h-4 w-4" />
            )}
            {isPending ? "Saving…" : saved ? "Saved!" : "Save Persona"}
          </button>
          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}
          {saved && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
              <Icon icon="solar:check-circle-bold" className="h-3.5 w-3.5" />
              Bot persona updated
            </p>
          )}
        </div>
      )}

      {!isOwner && (
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <Icon icon="solar:lock-keyhole-broken" className="h-4 w-4 shrink-0" />
          Only the business owner can modify the bot persona.
        </div>
      )}
    </div>
  );
}
