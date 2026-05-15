import type { Metadata } from "next";

export const metadata: Metadata = { title: "Invoices" };

export default function InvoicesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Invoices</h1>
      <p className="text-sm text-muted-foreground">Invoice list coming soon.</p>
    </div>
  );
}
