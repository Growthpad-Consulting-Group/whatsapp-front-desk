import { Metadata } from "next";
import { requireBusiness } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { BookingsClient } from "./bookings-client";

export const metadata: Metadata = {
  title: "Bookings — WhatsApp Front Desk",
};

export default async function BookingsPage() {
  const { business, staff } = await requireBusiness();
  const isOwner = staff.role === "owner";
  const supabase = await createClient();

  // Load active staff members for filtering/rescheduling
  const { data: staffMembers } = await supabase
    .from("staff_members")
    .select("id, name, active, calendar_connected")
    .eq("business_id", business.id)
    .order("name");

  // Load active services for filtering
  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_minutes, active")
    .eq("business_id", business.id)
    .order("name");

  // Load all appointments, joining with customer, service and staff
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysHence = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, customers(*), services(*), staff_members(*)")
    .eq("business_id", business.id)
    .gte("start_at", thirtyDaysAgo.toISOString())
    .lte("start_at", ninetyDaysHence.toISOString())
    .order("start_at", { ascending: false });

  return (
    <BookingsClient
      initialBookings={(appointments as any[]) || []}
      staffMembers={staffMembers || []}
      services={services || []}
      business={business}
      isOwner={isOwner}
    />
  );
}
