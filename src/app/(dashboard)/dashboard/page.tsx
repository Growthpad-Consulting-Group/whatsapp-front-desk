import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Today",
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Today</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Appointments today" value="—" />
        <StatCard label="Pending deposits" value="—" />
        <StatCard label="Unpaid invoices" value="—" />
        <StatCard label="Overdue balances" value="—" />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-base font-medium text-foreground mb-4">
            Upcoming bookings
          </h2>
          <p className="text-sm text-muted-foreground">No bookings yet.</p>
        </section>

        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-base font-medium text-foreground mb-4">
            Recent messages
          </h2>
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
