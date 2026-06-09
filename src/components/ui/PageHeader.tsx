"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderAction {
  label: string;
  icon?: string;
  variant?: "primary" | "secondary";
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string | ReactNode;
  icon?: string | ReactNode;
  iconBgColor?: string;
  actions?: PageHeaderAction[];
  children?: ReactNode;
  className?: string;
  /** @deprecated theme is now auto-detected via dark: variants */
  mode?: "light" | "dark";
}

function PageHeader({
  title,
  description,
  icon,
  iconBgColor = "bg-linear-to-br from-blue-600 to-blue-500",
  actions = [],
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("md:pt-0 pt-4 mb-6", className)}>
      <div className="relative overflow-hidden rounded-2xl md:px-8 px-4 py-8 border shadow-lg transition-all duration-300
        bg-linear-to-br from-slate-50 via-white to-slate-50 border-slate-200 shadow-slate-200/40
        dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 dark:border-slate-700 dark:shadow-slate-900/40">

        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl z-0 pointer-events-none
          bg-primary/10 dark:bg-primary/5" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl z-0 pointer-events-none
          bg-primary/5 dark:bg-primary/5" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: icon + title */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              {icon && (
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0", iconBgColor)}>
                  {typeof icon === "string"
                    ? <Icon icon={icon} className="w-7 h-7 text-white" />
                    : icon}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-extrabold bg-linear-to-r bg-clip-text text-transparent
                  from-slate-900 via-slate-800 to-slate-700
                  dark:from-white dark:via-slate-200 dark:to-slate-300">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm font-medium mt-0.5 max-w-lg text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          {(actions.length > 0 || children) && (
            <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  className={cn(
                    "group relative overflow-hidden px-5 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 font-medium text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
                    action.variant === "primary"
                      ? "bg-primary text-primary-foreground shadow-lg hover:opacity-90"
                      : "bg-white border border-border text-foreground hover:bg-muted shadow-sm dark:bg-slate-800 dark:hover:bg-slate-700"
                  )}
                >
                  {action.variant === "primary" && (
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  )}
                  <div className="relative flex items-center gap-2">
                    {action.loading
                      ? <Icon icon="svg-spinners:ring-resize" className="w-4 h-4 animate-spin" />
                      : action.icon && <Icon icon={action.icon} className="w-4 h-4" />
                    }
                    {action.label}
                  </div>
                </button>
              ))}
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { PageHeader };
export default PageHeader;
