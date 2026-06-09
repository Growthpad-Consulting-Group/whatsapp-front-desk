"use client";

import { logoutAction } from "@/actions/auth";
import { Icon } from "@iconify/react";

interface TopBarProps {
  businessName: string;
  staffName: string;
}

export function TopBar({ businessName, staffName }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
      {/* Mobile: show business name */}
      <p className="lg:hidden text-sm font-semibold text-foreground truncate">
        {businessName}
      </p>

      {/* Desktop: spacer */}
      <div className="hidden lg:block" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground hidden sm:block">
          {staffName}
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Sign out"
          >
            <Icon icon="solar:logout-broken" className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
