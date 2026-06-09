"use client";

import { Icon } from "@iconify/react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => typeof window !== "undefined" && window.print()}
      className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
    >
      <Icon icon="solar:printer-broken" className="h-4 w-4" /> Print Receipt
    </button>
  );
}
