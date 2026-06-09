import { Icon } from "@iconify/react";

export default function InvoicesLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Icon icon="mdi:loading" className="h-10 w-10 text-primary animate-spin" />
      <p className="text-xs text-muted-foreground font-semibold">Loading billing invoices...</p>
    </div>
  );
}
