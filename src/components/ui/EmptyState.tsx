"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  description: string;
  color?: string;
}

interface ActionProps {
  label: string;
  onClick: () => void;
  icon?: string;
  loading?: boolean;
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: ActionProps;
  secondaryAction?: Omit<ActionProps, "loading">;
  steps?: Step[];
  variant?: "default" | "premium" | "success" | "warning";
  className?: string;
}

const stepColors: Record<string, { badge: string; bg: string }> = {
  green:  { badge: "bg-green-600 text-white",  bg: "bg-green-50 text-green-900" },
  blue:   { badge: "bg-blue-600 text-white",   bg: "bg-blue-50 text-blue-900" },
  orange: { badge: "bg-orange-500 text-white", bg: "bg-orange-50 text-orange-900" },
  purple: { badge: "bg-purple-600 text-white", bg: "bg-purple-50 text-purple-900" },
  red:    { badge: "bg-red-600 text-white",    bg: "bg-red-50 text-red-900" },
};

export { EmptyState };
export default function EmptyState({
  icon = "solar:box-minimalistic-broken",
  title,
  description,
  action,
  secondaryAction,
  steps,
  variant = "default",
  className,
}: EmptyStateProps) {
  const iconStyles = {
    success: { wrapper: "bg-emerald-50", icon: "text-emerald-500" },
    warning: { wrapper: "bg-amber-50",   icon: "text-amber-500" },
    premium: { wrapper: "bg-green-50",   icon: "text-green-600" },
    default: { wrapper: "bg-gray-50",    icon: "text-gray-400" },
  }[variant];

  return (
    <div
      data-testid="empty-state"
      className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}
    >
      {/* Icon */}
      <div className="relative mb-8">
        {variant === "premium" && (
          <div className="absolute inset-0 bg-green-500/20 rounded-3xl rotate-6 animate-pulse -z-10" />
        )}
        <div className={cn(
          "w-20 h-20 rounded-3xl shadow-lg border border-gray-100 flex items-center justify-center transition-transform hover:scale-110 duration-500",
          iconStyles.wrapper
        )}>
          <Icon icon={icon} className={cn("w-10 h-10", iconStyles.icon)} />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-2xl font-extrabold mb-3 tracking-tight text-gray-900">{title}</h3>
      <p className="text-gray-500 mb-8 max-w-md font-medium leading-relaxed">{description}</p>

      {/* Steps */}
      {steps && steps.length > 0 && (
        <ol className="w-full max-w-xl mx-auto mb-10 text-left space-y-3 list-none">
          {steps.map((step, i) => {
            const c = stepColors[step.color ?? "green"] ?? stepColors.green;
            return (
              <li key={i} className={cn("flex items-start gap-4 p-4 rounded-2xl", c.bg)}>
                <div className={cn("w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-black shadow-lg", c.badge)}>
                  {i + 1}
                </div>
                <div>
                  <div className="font-bold text-sm uppercase tracking-tight mb-0.5">{step.title}</div>
                  <div className="text-xs opacity-80 font-medium leading-relaxed">{step.description}</div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {action && (
          <button
            onClick={action.onClick}
            disabled={action.loading}
            className="relative inline-flex items-center gap-3 px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-xl hover:shadow-green-600/40 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {action.loading
              ? <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />
              : <Icon icon={action.icon ?? "solar:add-circle-broken"} className="w-4 h-4" />
            }
            {action.label}
          </button>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="flex items-center gap-3 px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all shadow-sm hover:shadow-md"
          >
            <Icon icon={secondaryAction.icon ?? "solar:refresh-broken"} className="w-4 h-4" />
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
