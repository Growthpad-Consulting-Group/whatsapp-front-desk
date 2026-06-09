"use client";

import { useActionState } from "react";
import { createBusinessAction } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INDUSTRIES, TIMEZONES, CURRENCIES } from "@/lib/validations/onboarding";
import { GlassCard } from "@/components/ui/GlassCard";

interface OnboardingFormProps {
  userName?: string;
}

export function OnboardingForm({ userName }: OnboardingFormProps) {
  const [state, dispatch, pending] = useActionState(createBusinessAction, undefined);

  return (
    <GlassCard mode="light" gradient className="p-8 w-full max-w-sm">
    <form action={dispatch} className="space-y-5">
      {userName && (
        <p className="text-sm text-muted-foreground">
          Hi <span className="font-medium text-foreground">{userName}</span>,
          let&apos;s get your front desk ready.
        </p>
      )}

      <Input
        label="Business name"
        name="name"
        type="text"
        placeholder="Glow Beauty Studio"
        required
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="industry" className="text-sm font-medium text-foreground">
          Industry
        </label>
        <select
          id="industry"
          name="industry"
          required
          defaultValue=""
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="" disabled>Select your industry</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      <Input
        label="WhatsApp number"
        name="whatsapp_number"
        type="tel"
        placeholder="+254712345678"
        hint="Include country code. This is the number your clients will message."
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="timezone" className="text-sm font-medium text-foreground">
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            required
            defaultValue="Africa/Nairobi"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="currency" className="text-sm font-medium text-foreground">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            required
            defaultValue="KES"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {state?.success === false && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" className="w-full" size="lg" loading={pending}>
        Set up my front desk →
      </Button>
    </form>
    </GlassCard>
  );
}
