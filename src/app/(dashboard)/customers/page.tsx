import type { Metadata } from "next";
import { requireBusiness } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { CustomersClient } from "./customers-client";

export const metadata: Metadata = {
  title: "Customers Directory — WhatsApp Front Desk",
};

export default async function CustomersPage() {
  const { business, staff } = await requireBusiness();
  const isOwner = staff.role === "owner";
  const supabase = await createClient();

  // Fetch all customers scoped to this business
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", business.id)
    .order("name");

  // Fetch appointments to map last appointment dates in memory
  const { data: appts } = await supabase
    .from("appointments")
    .select("customer_id, start_at")
    .eq("business_id", business.id)
    .in("status", ["confirmed", "completed"]);

  // Fetch outstanding invoices to calculate unpaid balances in memory
  const { data: invs } = await supabase
    .from("invoices")
    .select("customer_id, amount, amount_paid")
    .eq("business_id", business.id)
    .in("status", ["sent", "due", "overdue", "partially_paid"]);

  return (
    <CustomersClient
      initialCustomers={customers || []}
      appointments={appts || []}
      invoices={invs || []}
      business={business}
      isOwner={isOwner}
    />
  );
}
