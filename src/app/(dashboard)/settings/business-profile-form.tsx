"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { updateBusinessProfileAction, updateBookingPoliciesAction } from "@/actions/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INDUSTRIES, TIMEZONES, CURRENCIES } from "@/lib/validations/onboarding";
import type { Business } from "@/types";
import toast from "react-hot-toast";

interface BusinessProfileFormProps {
  business: Business;
  isOwner: boolean;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionHeader({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3.5 pb-5 border-b border-border/50">
      <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-blue-400 shadow-sm shadow-blue-500/10 flex items-center justify-center shrink-0">
        <Icon icon={icon} className="w-5 h-5 text-white" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-base font-extrabold text-foreground leading-snug">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card/60 dark:bg-slate-900/60 backdrop-blur-md border border-border/80 rounded-2xl p-6 shadow-sm space-y-6 transition-all duration-300 hover:shadow-md ${className}`}>
      {children}
    </div>
  );
}

// ─── SaveRow component ───────────────────────────────────────────────────────

function SaveRow({ pending, disabled }: { pending: boolean; disabled: boolean }) {
  if (disabled) return null;
  return (
    <div className="flex items-center justify-end pt-2 border-t border-border/40">
      <Button
        type="submit"
        loading={pending}
        className="px-5 h-9 text-sm font-bold rounded-xl active:scale-95 transition-all duration-300"
      >
        Save
      </Button>
    </div>
  );
}

// ─── Local select wrapper (matches Input styling, scoped to this form) ────────

function Select({
  id, name, label, disabled, required, value, onChange, children,
}: {
  id: string; name: string; label: string;
  disabled?: boolean; required?: boolean; value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
      <select
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        value={value}
        onChange={onChange}
        className="h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-border/100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}

// ─── Section 1: Business Identity ────────────────────────────────────────────

function BusinessIdentityForm({ business, isOwner }: { business: Business; isOwner: boolean }) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState(updateBusinessProfileAction, undefined);

  const [name, setName] = useState(business.name);
  const [industry, setIndustry] = useState(business.industry || "");
  const [whatsappNumber, setWhatsappNumber] = useState(business.whatsapp_number);
  const [timezone, setTimezone] = useState(business.timezone);
  const [currency, setCurrency] = useState(business.currency);

  const [prevBusiness, setPrevBusiness] = useState(business);

  // Sync state with props changes during render (avoids cascading render lint warnings)
  if (business !== prevBusiness) {
    setPrevBusiness(business);
    setName(business.name);
    setIndustry(business.industry || "");
    setWhatsappNumber(business.whatsapp_number);
    setTimezone(business.timezone);
    setCurrency(business.currency);
  }

  useEffect(() => {
    if (state?.success === true) {
      toast.success("Business profile saved.");
      router.refresh();
    }
    else if (state?.success === false) {
      toast.error(state.error || "Failed to save.");
    }
  }, [state, router]);

  return (
    <SectionCard>
      <SectionHeader
        icon="solar:buildings-2-broken"
        title="Business Profile"
        description="Your business identity, contact details, and regional settings."
      />

      <form action={dispatch} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Business name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isOwner}
            required
          />

          <Select
            id="industry"
            name="industry"
            label="Industry"
            disabled={!isOwner}
            required
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="" disabled>Select your industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </Select>

          <Input
            label="WhatsApp WABA Number"
            name="whatsapp_number"
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            disabled={!isOwner}
            hint="Include country code, e.g. +254712345678"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              id="timezone"
              name="timezone"
              label="Timezone"
              disabled={!isOwner}
              required
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </Select>

            <Select
              id="currency"
              name="currency"
              label="Currency"
              disabled={!isOwner}
              required
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
        </div>

        <SaveRow pending={pending} disabled={!isOwner} />
      </form>
    </SectionCard>
  );
}

// ─── Section 2: Booking & Payment Policies ────────────────────────────────────

function BookingPoliciesForm({ business, isOwner }: { business: Business; isOwner: boolean }) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState(updateBookingPoliciesAction, undefined);

  const [cancellationHours, setCancellationHours] = useState(business.cancellation_hours.toString());
  const [depositPercent, setDepositPercent] = useState(business.deposit_default_percent?.toString() ?? "");

  const [prevBusiness, setPrevBusiness] = useState(business);

  // Sync state with props changes during render (avoids cascading render lint warnings)
  if (business !== prevBusiness) {
    setPrevBusiness(business);
    setCancellationHours(business.cancellation_hours.toString());
    setDepositPercent(business.deposit_default_percent?.toString() ?? "");
  }

  useEffect(() => {
    if (state?.success === true) {
      toast.success("Booking policies saved.");
      router.refresh();
    }
    else if (state?.success === false) {
      toast.error(state.error || "Failed to save.");
    }
  }, [state, router]);

  return (
    <SectionCard>
      <SectionHeader
        icon="solar:shield-check-broken"
        title="Booking & Payment Policies"
        description="Default rules for client cancellations and deposit requirements."
      />

      <form action={dispatch} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Cancellation Window (Hours)"
            name="cancellation_hours"
            type="number"
            min="0"
            max="168"
            value={cancellationHours}
            onChange={(e) => setCancellationHours(e.target.value)}
            disabled={!isOwner}
            hint="Minimum hours before an appointment a client can cancel."
            required
          />

          <Input
            label="Default Deposit Percent"
            name="deposit_default_percent"
            type="number"
            min="0"
            max="100"
            value={depositPercent}
            onChange={(e) => setDepositPercent(e.target.value)}
            disabled={!isOwner}
            hint="Leave blank if no deposit is required by default."
          />
        </div>

        <SaveRow pending={pending} disabled={!isOwner} />
      </form>
    </SectionCard>
  );
}

// ─── Section 3: Danger Zone ───────────────────────────────────────────────────

function DangerZone({ isOwner }: { isOwner: boolean }) {
  if (!isOwner) return null;

  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 p-6 space-y-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-red-600 to-red-400 shadow-sm shadow-red-500/10 flex items-center justify-center shrink-0">
          <Icon icon="solar:danger-triangle-broken" className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-red-700 dark:text-red-400 leading-snug">Danger Zone</h2>
          <p className="text-xs text-red-600/70 dark:text-red-400/60 mt-0.5 leading-relaxed">
            These actions are permanent and cannot be undone. Proceed with caution.
          </p>
        </div>
      </div>

      <div className="border-t border-red-200 dark:border-red-900/50 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Delete this business</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Permanently remove all data including bookings, invoices, and customers. This cannot be reversed.
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          className="shrink-0 h-9 px-4 text-sm font-bold rounded-xl"
          onClick={() => {
            toast.error("Contact support to delete your account.");
          }}
        >
          <Icon icon="solar:trash-bin-trash-broken" className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Delete Business
        </Button>
      </div>
    </div>
  );
}

// ─── Composed export ──────────────────────────────────────────────────────────

export function BusinessProfileForm({ business, isOwner }: BusinessProfileFormProps) {
  return (
    <div className="space-y-6">
      <BusinessIdentityForm business={business} isOwner={isOwner} />
      <BookingPoliciesForm business={business} isOwner={isOwner} />
      <DangerZone isOwner={isOwner} />
    </div>
  );
}
