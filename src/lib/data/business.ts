import "server-only";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Business, StaffMember } from "@/types";

/**
 * Returns the current user's business and staff record.
 * Redirects to /login if not authenticated, /onboarding if no business yet.
 */
export async function requireBusiness(): Promise<{
  business: Business;
  staff: StaffMember;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: staff } = await supabase
    .from("staff_members")
    .select("*, businesses(*)")
    .eq("user_id", user.id)
    .eq("active", true)
    .single();

  if (!staff || !staff.businesses) redirect("/onboarding");

  return {
    business: staff.businesses as Business,
    staff: staff as StaffMember,
  };
}

/**
 * Returns today's appointment stats for the dashboard.
 */
export async function getTodayStats(businessId: string) {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [appointmentsRes, depositsRes, invoicesRes, overdueRes] =
    await Promise.all([
      // Appointments today (confirmed + pending)
      supabase
        .from("appointments")
        .select("id, status, start_at, end_at, payment_status, customers(name, phone), services(name)")
        .eq("business_id", businessId)
        .gte("start_at", todayStart.toISOString())
        .lte("start_at", todayEnd.toISOString())
        .in("status", ["confirmed", "pending"])
        .order("start_at"),

      // Pending deposits
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("payment_status", "deposit_pending"),

      // Unpaid invoices
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .in("status", ["sent", "due"]),

      // Overdue invoices
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("status", "overdue"),
    ]);

  return {
    todayAppointments: appointmentsRes.data ?? [],
    pendingDeposits: depositsRes.count ?? 0,
    unpaidInvoices: invoicesRes.count ?? 0,
    overdueInvoices: overdueRes.count ?? 0,
  };
}

/**
 * Returns the 5 most recent message log entries.
 */
export async function getRecentMessages(businessId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("message_logs")
    .select("id, direction, content_summary, status, timestamp, customers(name, phone)")
    .eq("business_id", businessId)
    .order("timestamp", { ascending: false })
    .limit(5);

  return data ?? [];
}
