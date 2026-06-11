"use client";

import { type ReactNode } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface WhatsAppWindowProps {
  /** Displayed name in the header */
  name: string;
  /** Sub-line below the name (e.g. phone number, "online", status text) */
  subtitle?: string;
  /** Two-letter initials rendered in the avatar circle — takes priority over avatarIcon */
  avatarInitials?: string;
  /** Iconify icon used as avatar when no initials are provided */
  avatarIcon?: string;
  /** If provided, renders a back-arrow button on the far left */
  onBack?: () => void;
  /** Slot rendered on the right side of the header (badges, action buttons, etc.) */
  headerRight?: ReactNode;
  /** Content rendered inside the wallpaper chat body */
  children: ReactNode;
  /** Optional footer bar rendered below the chat body (input bar, hints, etc.) */
  footer?: ReactNode;
  /** Extra classes on the outermost wrapper (e.g. h-150, flex-1) */
  className?: string;
  /** Extra classes on the scrollable chat body */
  bodyClassName?: string;
}

const WALLPAPER_STYLE: React.CSSProperties = {
  background:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%239C92AC' fill-opacity='0.045'%3E%3Cpath fill-rule='evenodd' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zM11 13c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm48 25c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM38 34c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-2c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm16-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0-2c.276 0 .5-.224.5-.5s-.224-.5-.5-.5-.5.224-.5.5.224.5.5.5zM22 64c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0-2c.276 0 .5-.224.5-.5s-.224-.5-.5-.5-.5.224-.5.5.224.5.5.5zm30 4c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0-2c.276 0 .5-.224.5-.5s-.224-.5-.5-.5-.5.224-.5.5.224.5.5.5zM32 50c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm0-2c.276 0 .5-.224.5-.5s-.224-.5-.5-.5-.5.224-.5.5.224.5.5.5z'/%3E%3C/g%3E%3C/svg%3E\"), linear-gradient(to bottom, #e5ddd5, #d0c8bc)",
};

const WALLPAPER_DARK_CLASS = "dark:[background:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%231c2c35' fill-opacity='0.55'%3E%3Cpath fill-rule='evenodd' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zM11 13c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm48 25c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z'/%3E%3C/g%3E%3C/svg%3E\")_linear-gradient(to_bottom,#0b141a,#0b141a)]";

export function WhatsAppWindow({
  name,
  subtitle,
  avatarInitials,
  avatarIcon = "solar:chat-round-dots-broken",
  onBack,
  headerRight,
  children,
  footer,
  className,
  bodyClassName,
}: WhatsAppWindowProps) {
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-3xl border border-border/80 shadow-sm", className)}>
      {/* ── Header ── */}
      <div className="bg-[#075e54] dark:bg-[#1f2c34] px-4 py-3 flex items-center gap-3 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="h-8 w-8 rounded-lg hover:bg-white/10 text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Go back"
          >
            <Icon icon="solar:arrow-left-broken" className="h-5 w-5" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="h-9 w-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
            {avatarInitials ? (
              <span>{avatarInitials.substring(0, 2).toUpperCase()}</span>
            ) : (
              <Icon icon={avatarIcon} className="h-4.5 w-4.5" />
            )}
          </div>
          {/* Online dot */}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#075e54] dark:border-[#1f2c34]" />
        </div>

        {/* Name + subtitle */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate leading-tight">{name}</p>
          {subtitle && (
            <p className="text-[10px] text-green-300 truncate">{subtitle}</p>
          )}
        </div>

        {/* Right slot */}
        {headerRight && (
          <div className="shrink-0 flex items-center gap-2">{headerRight}</div>
        )}
      </div>

      {/* ── Chat body (wallpaper) ── */}
      <div
        className={cn("flex-1 overflow-y-auto px-4 py-4", WALLPAPER_DARK_CLASS, bodyClassName)}
        style={WALLPAPER_STYLE}
      >
        {children}
      </div>

      {/* ── Footer ── */}
      {footer && (
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] border-t border-black/10 dark:border-white/5 px-4 pt-2.5 pb-3 shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
}
