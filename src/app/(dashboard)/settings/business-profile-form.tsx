"use client";

import { useActionState } from "react";
import { Icon } from "@iconify/react";
import { updateBusinessSettingsAction } from "@/actions/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INDUSTRIES, TIMEZONES, CURRENCIES } from "@/lib/validations/onboarding";
import type { Business } from "@/types";

interface BusinessProfileFormProps {
  business: Business;
  isOwner: boolean;
}

function SectionHeader({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-border/60">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon icon={icon} className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export function BusinessProfileForm({ business, isOwner }: BusinessProfileFormProps) {
  const [state, dispatch, pending] = useActionState(updateBusinessSettingsAction, undefined);

  return (
    <form action={dispatch} className="space-y-5">
      {/* Business Identity */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <SectionHeader
          icon="solar:buildings-2-broken"
          title="Business Profile"
          description="Your business identity, contact details, and regional settings."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Business name"
            name="name"
            type="text"
            defaultValue={business.name}
            disabled={!isOwner}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="industry" className="text-sm font-medium text-foreground">
              Industry
            </label>
            <select
              id="industry"
              name="industry"
              disabled={!isOwner}
              required
              defaultValue={business.industry || ""}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" disabled>Select your industry</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <Input
            label="WhatsApp WABA Number"
            name="whatsapp_number"
            type="tel"
            defaultValue={business.whatsapp_number}
            disabled={!isOwner}
            hint="Include country code, e.g. +254712345678"
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
                disabled={!isOwner}
                required
                defaultValue={business.timezone}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={!isOwner}
                required
                defaultValue={business.currency}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Booking & Payment Policies */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <SectionHeader
          icon="solar:shield-check-broken"
          title="Booking & Payment Policies"
          description="Default rules for client cancellations and deposit requirements."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Cancellation Window (Hours)"
            name="cancellation_hours"
            type="number"
            min="0"
            max="168"
            defaultValue={business.cancellation_hours}
            disabled={!isOwner}
            hint="Minimum hours before appointment a client can cancel."
            required
          />

          <Input
            label="Default Deposit Percent"
            name="deposit_default_percent"
            type="number"
            min="0"
            max="100"
            defaultValue={business.deposit_default_percent ?? ""}
            disabled={!isOwner}
            hint="Leave blank if no deposit is required by default."
          />
        </div>
      </div>

      {isOwner && (
        <div className="flex items-center justify-end gap-3">
          {state?.success === false && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <Icon icon="solar:close-circle-broken" className="w-4 h-4 shrink-0" />
              {state.error}
            </div>
          )}
          {state?.success === true && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Icon icon="solar:check-circle-broken" className="w-4 h-4 shrink-0" />
              Settings saved successfully!
            </div>
          )}
          <Button type="submit" loading={pending}>
            Save Settings
          </Button>
        </div>
      )}
    </form>
  );
}
