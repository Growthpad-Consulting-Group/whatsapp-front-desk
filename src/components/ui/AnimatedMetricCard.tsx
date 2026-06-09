"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type MetricColor = "green" | "blue" | "orange" | "purple" | "red";

interface AnimatedMetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: MetricColor;
  loading?: boolean;
  previousValue?: string | number;
  trend?: "up" | "down" | "neutral";
  variant?: "card" | "glass" | "transparent";
  href?: string;
  /** @deprecated theme is now auto-detected via dark: variants */
  mode?: "light" | "dark";
  className?: string;
}

const gradients: Record<MetricColor, string> = {
  green:  "from-green-500 to-green-400",
  blue:   "from-blue-500 to-blue-400",
  orange: "from-orange-500 to-orange-400",
  purple: "from-purple-500 to-purple-400",
  red:    "from-red-500 to-red-400",
};

function AnimatedMetricCard({
  title,
  value,
  icon,
  color,
  loading = false,
  previousValue,
  trend = "neutral",
  variant = "card",
  href,
  className,
}: AnimatedMetricCardProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const gradient = gradients[color];

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const cardContent = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 border group transition-all duration-300 cursor-pointer",
        variant === "card" && "bg-white dark:bg-card border-slate-100 dark:border-border shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        variant === "glass" && "bg-white/70 dark:bg-card/60 border-white/40 dark:border-white/10 backdrop-blur-xl shadow-lg",
        variant === "transparent" && "bg-transparent border-transparent",
        className
      )}
    >
      {/* Decorative bg circle */}
      {variant !== "transparent" && (
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 bg-linear-to-br opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300",
          gradient
        )} />
      )}

      <div className="relative z-10 flex items-center gap-4">
        {/* Icon bubble */}
        <div className={cn("p-3 rounded-xl bg-linear-to-br shadow-lg shrink-0", gradient)}>
          {loading
            ? <Icon icon="svg-spinners:ring-resize" className="w-6 h-6 text-white animate-spin" />
            : <Icon icon={icon} className="w-6 h-6 text-white" />
          }
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={String(displayValue)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-extrabold mb-0.5 text-slate-900 dark:text-foreground"
          >
            {loading
              ? <div className="h-7 w-16 bg-slate-200 dark:bg-muted rounded animate-pulse" />
              : displayValue
            }
          </motion.div>

          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-500 dark:text-muted-foreground">{title}</p>
            {trend !== "neutral" && !loading && (
              <span className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold",
                trend === "up"
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                  : "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400"
              )}>
                <Icon
                  icon={trend === "up" ? "solar:arrow-up-broken" : "solar:arrow-down-broken"}
                  className="w-2.5 h-2.5"
                />
                {previousValue}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{cardContent}</Link>;
  }

  return cardContent;
}

export { AnimatedMetricCard };
export default AnimatedMetricCard;
