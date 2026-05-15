import type { Metadata } from "next";

export const metadata: Metadata = { title: "Customers" };

export default function CustomersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Customers</h1>
      <p className="text-sm text-muted-foreground">Customer list coming soon.</p>
    </div>
  );
}
