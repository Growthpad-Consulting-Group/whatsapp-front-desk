import type { Metadata } from "next";
import { requireBusiness, getTodayStats, getRecentMessages } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const metadata: Metadata = {
  title: "Today — WhatsApp Front Desk",
};

export default async function DashboardPage() {
  const { business, staff } = await requireBusiness();
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

  // Chart data — weekly bookings (this week Mon-Sun)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { data: weekAppointments } = await supabase
    .from("appointments")
    .select("start_at, status")
    .eq("business_id", business.id)
    .gte("start_at", weekStart.toISOString())
    .lte("start_at", weekEnd.toISOString());

  const confirmedByDay = Array(7).fill(0);
  const cancelledByDay = Array(7).fill(0);
  (weekAppointments || []).forEach((a: any) => {
    const day = new Date(a.start_at).getDay();
    if (a.status === "cancelled") cancelledByDay[day]++;
    else confirmedByDay[day]++;
  });
  const weeklyBookings = {
    labels: DAY_LABELS,
    confirmed: confirmedByDay,
    cancelled: cancelledByDay,
  };

  // Chart data — revenue last 8 weeks from paid invoices
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const { data: paidInvoices } = await supabase
    .from("invoices")
    .select("amount, updated_at")
    .eq("business_id", business.id)
    .eq("status", "paid")
    .gte("updated_at", eightWeeksAgo.toISOString());

  const revenueByWeek: Record<number, number> = {};
  (paidInvoices || []).forEach((inv: any) => {
    const d = new Date(inv.updated_at);
    const weekNum = Math.floor((Date.now() - d.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const idx = 7 - weekNum;
    if (idx >= 0 && idx < 8) revenueByWeek[idx] = (revenueByWeek[idx] || 0) + Number(inv.amount);
  });
  const revenueLabels = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (7 - i) * 7);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  });
  const revenueData = {
    labels: revenueLabels,
    revenue: Array.from({ length: 8 }, (_, i) => revenueByWeek[i] || 0),
  };

  // Heatmap — last 30 days of appointments
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: heatmapAppointments } = await supabase
    .from("appointments")
    .select("start_at, status")
    .eq("business_id", business.id)
    .gte("start_at", thirtyDaysAgo.toISOString());

  return (
    <DashboardClient
      todayAppointments={todayAppointments}
      heatmapAppointments={heatmapAppointments || []}
      pendingDeposits={pendingDeposits}
      unpaidInvoices={unpaidInvoices}
      overdueInvoices={overdueInvoices}
      recentMessages={recentMessages}
      cancelledCount={cancelledCount}
      staffName={staff.name}
      staffId={staff.id}
      onboardingSteps={onboardingSteps}
      business={business}
      weeklyBookings={weeklyBookings}
      revenueData={revenueData}
    />
  );
}
