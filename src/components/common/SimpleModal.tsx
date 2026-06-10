"use client";

import {
  ReactNode,
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  Ref,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export interface SimpleModalHandle {
  handleClose: () => void;
}

type Variant = "primary" | "danger" | "warning" | "info";

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  width?: string;
  rightElement?: ReactNode;
  hasUnsavedChanges?: boolean;
  disableOutsideClick?: boolean;
  noPadding?: boolean;
  variant?: Variant;
  ref?: Ref<SimpleModalHandle>;
}

const VARIANT_ACCENT: Record<Variant, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  danger:  "bg-red-500/10 text-red-500 border-red-500/20",
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  info:    "bg-sky-500/10 text-sky-500 border-sky-500/20",
};

const VARIANT_ICON: Record<Variant, string> = {
  primary: "solar:pen-new-square-broken",
  danger:  "solar:trash-bin-minimalistic-broken",
  warning: "solar:danger-triangle-broken",
  info:    "solar:info-circle-broken",
};

function UnsavedDialog({ onDiscard, onResume }: { onDiscard: () => void; onResume: () => void }) {
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onResume}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        className="relative w-full max-w-sm p-8 rounded-3xl shadow-2xl text-center flex flex-col items-center border bg-background border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Icon icon="solar:danger-triangle-broken" className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-xl font-black tracking-tight mb-2 text-foreground">Unsaved Changes</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          If you exit now, your changes will be <span className="text-red-500 font-bold">lost</span>.
        </p>
        <div className="flex gap-3 w-full">
          <button onClick={onResume} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors text-foreground">
            Keep Editing
          </button>
          <button onClick={onDiscard} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
            Discard & Exit
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SimpleModalInner({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  width = "max-w-2xl",
  rightElement,
  hasUnsavedChanges = false,
  disableOutsideClick = false,
  noPadding = false,
  variant = "primary",
  ref,
}: SimpleModalProps) {
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [mounted] = useState(() => typeof window !== "undefined");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, [isOpen]);

  const tryClose = () => {
    if (disableOutsideClick) return;
    if (hasUnsavedChanges) setShowUnsaved(true);
    else onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) setShowUnsaved(true);
    else onClose();
  };

  useImperativeHandle(ref, () => ({ handleClose }));

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") tryClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, hasUnsavedChanges]);

  if (!mounted) return null;

  const resolvedIcon = icon ?? VARIANT_ICON[variant];

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={tryClose}
            />

            {/* Modal */}
            <motion.div
              ref={contentRef}
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative w-full max-h-[92vh] flex flex-col overflow-hidden",
                "rounded-t-3xl sm:rounded-3xl shadow-2xl border bg-background border-border",
                width,
              )}
            >
              {/* Header */}
              {(title || rightElement) && (
                <div className="flex items-center gap-3 px-5 py-4 bg-slate-100 dark:bg-slate-900 border-b border-border/60 shrink-0">
                  {title && (
                    <>
                      <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center shrink-0", VARIANT_ACCENT[variant])}>
                        <Icon icon={resolvedIcon} className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-foreground leading-tight truncate">{title}</h2>
                        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
                      </div>
                    </>
                  )}
                  {!title && <div className="flex-1" />}
                  {rightElement && <div className="shrink-0">{rightElement}</div>}
                  <button
                    onClick={handleClose}
                    className="group p-1.5 rounded-xl border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-90 shrink-0"
                    aria-label="Close"
                  >
                    <Icon icon="solar:close-circle-broken" className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                  </button>
                </div>
              )}

              {/* Close button only (no title) */}
              {!title && !rightElement && (
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={handleClose}
                    className="group p-1.5 rounded-xl border border-border bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-90"
                    aria-label="Close"
                  >
                    <Icon icon="solar:close-circle-broken" className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                  </button>
                </div>
              )}

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                <div className={noPadding ? "" : "px-5 py-5"}>{children}</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUnsaved && (
          <UnsavedDialog
            onDiscard={() => { setShowUnsaved(false); onClose(); }}
            onResume={() => setShowUnsaved(false)}
          />
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}

export { SimpleModalInner as SimpleModal };
export default SimpleModalInner;
