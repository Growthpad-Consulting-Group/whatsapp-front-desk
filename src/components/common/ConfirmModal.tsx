"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";

type Variant = "danger" | "warning" | "info";

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  loading?: boolean;
}

const CONFIG: Record<Variant, { icon: string; iconBg: string; iconColor: string; confirmBg: string }> = {
  danger: {
    icon: "solar:trash-bin-minimalistic-broken",
    iconBg: "bg-red-500/10 border-red-500/20",
    iconColor: "text-red-500",
    confirmBg: "bg-red-500 hover:bg-red-600 focus-visible:ring-red-400",
  },
  warning: {
    icon: "solar:danger-triangle-broken",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    iconColor: "text-amber-500",
    confirmBg: "bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400",
  },
  info: {
    icon: "solar:info-circle-broken",
    iconBg: "bg-sky-500/10 border-sky-500/20",
    iconColor: "text-sky-500",
    confirmBg: "bg-sky-500 hover:bg-sky-600 focus-visible:ring-sky-400",
  },
};

function ConfirmModalInner({
  isOpen,
  onConfirm,
  onCancel,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);
  const cfg = CONFIG[variant];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 ${isDark ? "bg-gray-900/70" : "bg-gray-900/50"} backdrop-blur-sm`}
            onClick={onCancel}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            className={[
              "relative w-full max-w-sm rounded-3xl shadow-2xl border p-8 flex flex-col items-center text-center",
              isDark
                ? "bg-gray-900 border-white/10 text-white"
                : "bg-white border-gray-100 text-gray-900",
            ].join(" ")}
          >
            {/* Icon */}
            <div className={`mb-5 w-16 h-16 rounded-2xl border flex items-center justify-center ${cfg.iconBg}`}>
              <Icon icon={cfg.icon} className={`w-8 h-8 ${cfg.iconColor}`} />
            </div>

            <h3 className="text-xl font-black tracking-tight mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-7">{description}</p>

            <div className="flex gap-3 w-full">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={[
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50",
                  cfg.confirmBg,
                ].join(" ")}
              >
                {loading && (
                  <Icon icon="solar:refresh-broken" className="w-4 h-4 animate-spin" />
                )}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export { ConfirmModalInner as ConfirmModal };
export default ConfirmModalInner;
