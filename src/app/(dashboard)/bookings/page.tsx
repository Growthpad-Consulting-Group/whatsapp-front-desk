import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bookings" };

export default function BookingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Bookings</h1>
      <p className="text-sm text-muted-foreground">Booking list coming soon.</p>
    </div>
  );
}
