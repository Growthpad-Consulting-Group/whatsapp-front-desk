"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: ReactNode;
  mode?: "light" | "dark";
  gradient?: boolean;
  blur?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  interactive?: boolean;
  className?: string;
}

const blurMap = {
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
  "2xl": "backdrop-blur-2xl",
  "3xl": "backdrop-blur-3xl",
};

function GlassCard({
  children,
  mode = "light",
  gradient = false,
  blur = "xl",
  interactive = false,
  className,
  ...props
}: GlassCardProps) {
  const isDark = mode === "dark";

  return (
    <motion.div
      whileHover={interactive ? { scale: 1.01 } : undefined}
      className={cn(
        "relative overflow-hidden rounded-[2rem] shadow-xl transition-shadow duration-300",
        blurMap[blur],
        isDark
          ? "bg-gray-900/60 border border-white/10"
          : "bg-white/70 border border-white/40",
        interactive && "hover:shadow-2xl",
        className
      )}
      {...props}
    >
      {gradient && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-green-400/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-emerald-300/10 blur-3xl animate-pulse delay-1000" />
        </div>
      )}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}

export { GlassCard };
export default GlassCard;
