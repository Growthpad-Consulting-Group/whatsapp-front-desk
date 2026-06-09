"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

type StatCardColor =
  | "green"
  | "blue"
  | "orange"
  | "purple"
  | "red"
  | "yellow"
  | "gray";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: string;
  color?: StatCardColor;
  mode?: "light" | "dark";
  onClick?: () => void;
  loading?: boolean;
  size?: "small" | "medium" | "large";
  subtitle?: string;
  layout?: "horizontal" | "vertical";
  className?: string;
}

const gradients: Record<StatCardColor, string> = {
  green: "from-green-500 to-green-400",
  blue: "from-blue-500 to-blue-400",
  orange: "from-orange-500 to-orange-400",
  purple: "from-purple-500 to-purple-400",
  red: "from-red-500 to-red-400",
  yellow: "from-yellow-500 to-yellow-400",
  gray: "from-gray-500 to-gray-400",
};

const iconSizes = {
  small: "w-4 h-4",
  medium: "w-5 h-5",
  large: "w-6 h-6",
};

const valueSizes = {
  small: "text-xl",
  medium: "text-2xl",
  large: "text-3xl",
};

const paddings = {
  small: "p-2.5",
  medium: "p-3",
  large: "p-3.5",
};

function StatCard({
  label,
  value,
  icon,
  color = "green",
  mode = "light",
  onClick,
  loading = false,
  size = "medium",
  subtitle,
  layout = "horizontal",
  className,
}: StatCardProps) {
  const isDark = mode === "dark";
  const gradient = gradients[color];
  const Root = onClick ? "button" : "div";

  return (
    <Root
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 border group transition-all duration-500 hover:shadow-2xl",
        isDark
          ? "bg-slate-800 border-slate-700 shadow-slate-900/50"
          : "bg-white border-slate-100 shadow-xl shadow-slate-200/50",
        onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      {/* Decorative background circle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-32 h-32 bg-linear-to-br opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300",
          gradient
        )}
      />

      <div className="relative z-10">
        {layout === "vertical" ? (
          <div className="flex flex-col items-start gap-3">
            <div className={cn("rounded-2xl bg-linear-to-br shadow-lg", gradient, paddings[size])}>
              {loading ? (
                <Icon icon="svg-spinners:ring-resize" className={cn(iconSizes[size], "text-white animate-spin")} />
              ) : (
                <Icon icon={icon} className={cn(iconSizes[size], "text-white")} />
              )}
            </div>
            <div className="flex-1 min-w-0 w-full">
              <p className={cn("text-sm font-bold mb-2", isDark ? "text-slate-300" : "text-slate-900")}>{label}</p>
              <div className={cn("font-extrabold", valueSizes[size], isDark ? "text-white" : "text-slate-900")}>
                {loading ? <Icon icon="svg-spinners:ring-resize" className="w-6 h-6 animate-spin" /> : value}
              </div>
              {subtitle && <p className={cn("text-sm mt-1", isDark ? "text-slate-500" : "text-gray-500")}>{subtitle}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className={cn("rounded-2xl bg-linear-to-br shadow-lg shrink-0", gradient, paddings[size])}>
              {loading ? (
                <Icon icon="svg-spinners:ring-resize" className={cn(iconSizes[size], "text-white animate-spin")} />
              ) : (
                <Icon icon={icon} className={cn(iconSizes[size], "text-white")} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn("font-extrabold mb-1", valueSizes[size], isDark ? "text-white" : "text-slate-900")}>
                {loading ? <Icon icon="svg-spinners:ring-resize" className="w-6 h-6 animate-spin" /> : value}
              </div>
              <p className={cn("text-sm font-bold", isDark ? "text-slate-300" : "text-slate-500")}>{label}</p>
              {subtitle && <p className={cn("text-xs mt-0.5", isDark ? "text-slate-500" : "text-gray-400")}>{subtitle}</p>}
            </div>
          </div>
        )}
      </div>
    </Root>
  );
}

export { StatCard };
export default StatCard;
