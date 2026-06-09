"use client";

import { memo } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

type StatusContext = "appointment" | "payment" | "invoice" | "user";
type PillSize = "xs" | "sm" | "md" | "lg";
type PillVariant = "default" | "outlined" | "solid";

interface StatusConfig {
  bg: string;
  text: string;
  border: string;
  icon: string;
  label: string;
}

const STATUS_MAP: Record<string, Record<string, StatusConfig>> = {
  appointment: {
    pending: {
      bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200",
      icon: "solar:clock-circle-broken", label: "Pending",
    },
    confirmed: {
      bg: "bg-green-100", text: "text-green-700", border: "border-green-200",
      icon: "solar:check-circle-broken", label: "Confirmed",
    },
    completed: {
      bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200",
      icon: "solar:check-read-broken", label: "Completed",
    },
    cancelled: {
      bg: "bg-red-100", text: "text-red-700", border: "border-red-200",
      icon: "solar:close-circle-broken", label: "Cancelled",
    },
    no_show: {
      bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200",
      icon: "solar:user-cross-broken", label: "No Show",
    },
  },
  payment: {
    paid: {
      bg: "bg-green-100", text: "text-green-700", border: "border-green-200",
      icon: "solar:wallet-money-broken", label: "Paid",
    },
    unpaid: {
      bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200",
      icon: "solar:wallet-broken", label: "Unpaid",
    },
    partially_paid: {
      bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200",
      icon: "solar:dollar-minimalistic-broken", label: "Partial",
    },
    overdue: {
      bg: "bg-red-100", text: "text-red-700", border: "border-red-200",
      icon: "solar:danger-broken", label: "Overdue",
    },
    deposit_pending: {
      bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200",
      icon: "solar:clock-circle-broken", label: "Deposit Due",
    },
    deposit_paid: {
      bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200",
      icon: "solar:check-circle-broken", label: "Deposit Paid",
    },
    refunded: {
      bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200",
      icon: "solar:restart-broken", label: "Refunded",
    },
  },
  invoice: {
    draft: {
      bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200",
      icon: "solar:document-text-broken", label: "Draft",
    },
    sent: {
      bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200",
      icon: "solar:plain-2-broken", label: "Sent",
    },
    due: {
      bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200",
      icon: "solar:calendar-mark-broken", label: "Due",
    },
    overdue: {
      bg: "bg-red-100", text: "text-red-700", border: "border-red-200",
      icon: "solar:danger-triangle-broken", label: "Overdue",
    },
    paid: {
      bg: "bg-green-100", text: "text-green-700", border: "border-green-200",
      icon: "solar:check-read-broken", label: "Paid",
    },
    cancelled: {
      bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200",
      icon: "solar:close-square-broken", label: "Cancelled",
    },
    partially_paid: {
      bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200",
      icon: "solar:dollar-minimalistic-broken", label: "Partial",
    },
    disputed: {
      bg: "bg-red-100", text: "text-red-700", border: "border-red-200",
      icon: "solar:danger-broken", label: "Disputed",
    },
  },
  user: {
    active: {
      bg: "bg-green-100", text: "text-green-700", border: "border-green-200",
      icon: "solar:user-check-broken", label: "Active",
    },
    inactive: {
      bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200",
      icon: "solar:user-minus-broken", label: "Inactive",
    },
    suspended: {
      bg: "bg-red-100", text: "text-red-700", border: "border-red-200",
      icon: "solar:user-block-broken", label: "Suspended",
    },
    pending: {
      bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200",
      icon: "solar:user-plus-broken", label: "Pending",
    },
    owner: {
      bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200",
      icon: "solar:shield-star-broken", label: "Owner",
    },
    staff: {
      bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200",
      icon: "solar:user-broken", label: "Staff",
    },
  },
};

const FALLBACK: StatusConfig = {
  bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200",
  icon: "solar:question-circle-broken", label: "Unknown",
};

const SIZE_CLASSES: Record<PillSize, string> = {
  xs: "text-xs px-1.5 py-0.5 gap-1",
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
  lg: "text-sm px-3 py-1.5 gap-1.5",
};

const ICON_SIZES: Record<PillSize, string> = {
  xs: "w-2.5 h-2.5",
  sm: "w-3 h-3",
  md: "w-3.5 h-3.5",
  lg: "w-4 h-4",
};

interface StatusPillProps {
  status: string | boolean | null | undefined;
  context?: StatusContext;
  showIcon?: boolean;
  size?: PillSize;
  variant?: PillVariant;
  customLabel?: string;
  mode?: "light" | "dark";
  className?: string;
}

const StatusPill = memo(function StatusPill({
  status,
  context = "appointment",
  showIcon = true,
  size = "sm",
  variant = "default",
  customLabel,
  className,
}: StatusPillProps) {
  if (status === null || status === undefined) {
    const cfg = FALLBACK;
    return (
      <span className={cn("inline-flex items-center rounded-full font-medium border", SIZE_CLASSES[size], cfg.bg, cfg.text, cfg.border, className)}>
        {showIcon && <Icon icon={cfg.icon} className={ICON_SIZES[size]} />}
        {customLabel ?? cfg.label}
      </span>
    );
  }

  const normalised = String(status).toLowerCase().trim().replace(/ /g, "_");
  const contextMap = STATUS_MAP[context] ?? {};
  const cfg = contextMap[normalised] ?? FALLBACK;
  const label = customLabel ?? cfg.label;

  if (variant === "solid") {
    // Extract color name from bg class to build solid version
    const solidBg = cfg.bg.replace("bg-", "bg-").replace("-100", "-600");
    return (
      <span className={cn("inline-flex items-center rounded-full font-medium border border-transparent", SIZE_CLASSES[size], solidBg, "text-white", className)}>
        {showIcon && <Icon icon={cfg.icon} className={ICON_SIZES[size]} />}
        {label}
      </span>
    );
  }

  if (variant === "outlined") {
    return (
      <span className={cn("inline-flex items-center rounded-full font-medium bg-transparent border", SIZE_CLASSES[size], cfg.text, cfg.border, className)}>
        {showIcon && <Icon icon={cfg.icon} className={ICON_SIZES[size]} />}
        {label}
      </span>
    );
  }

  // default
  return (
    <span className={cn("inline-flex items-center rounded-full font-medium border", SIZE_CLASSES[size], cfg.bg, cfg.text, cfg.border, className)}>
      {showIcon && <Icon icon={cfg.icon} className={ICON_SIZES[size]} />}
      {label}
    </span>
  );
});

export { StatusPill };
export default StatusPill;
