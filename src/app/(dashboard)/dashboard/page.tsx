import type { Metadata } from "next";
import { requireBusiness, getTodayStats, getRecentMessages } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Today — WhatsApp Front Desk",
};

export default async function DashboardPage() {
  const { business } = await requireBusiness();
  const supabase = await createClient();

  // Load basic stats
  const { todayAppointments, pendingDeposits, unpaidInvoices, overdueInvoices } =
    await getTodayStats(business.id);
  const recentMessages = await getRecentMessages(business.id);

  // Load cancelled bookings today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: cancelledAppointments } = await supabase
    .from("appointments")
    .select("id")
    .eq("business_id", business.id)
    .eq("status", "cancelled")
    .gte("updated_at", todayStart.toISOString())
    .lte("updated_at", todayEnd.toISOString());

  const cancelledCount = cancelledAppointments?.length || 0;

  // ----------------------------------------------------
  // Onboarding Progress Checklist Queries
  // ----------------------------------------------------
  const [hoursRes, servicesRes, staffRes] = await Promise.all([
    supabase.from("operating_hours").select("id").eq("business_id", business.id),
    supabase.from("services").select("id").eq("business_id", business.id).eq("active", true),
    supabase.from("staff_members").select("id, calendar_connected").eq("business_id", business.id),
  ]);

  const onboardingSteps = {
    hoursConfigured: (hoursRes.data?.length || 0) > 0,
    servicesAdded: (servicesRes.data?.length || 0) > 0,
    calendarConnected: (staffRes.data || []).some((s) => s.calendar_connected),
  };

  return (
    <DashboardClient
      todayAppointments={todayAppointments}
      pendingDeposits={pendingDeposits}
      unpaidInvoices={unpaidInvoices}
      overdueInvoices={overdueInvoices}
      recentMessages={recentMessages}
      cancelledCount={cancelledCount}
      onboardingSteps={onboardingSteps}
      business={business}
    />
  );
}
