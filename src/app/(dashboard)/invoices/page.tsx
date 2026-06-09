import type { Metadata } from "next";
import { requireBusiness } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { InvoicesClient } from "./invoices-client";

export const metadata: Metadata = {
  title: "Invoices — WhatsApp Front Desk",
};

export default async function InvoicesPage() {
  const { business } = await requireBusiness();
  const supabase = await createClient();

  // Load all invoices scoped to this business, joining customer information
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, customers(*)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  // Load active customer directory to support manual invoice generation
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, phone")
    .eq("business_id", business.id)
    .order("name");

  // Load active services to make manual items list easier
  const { data: services } = await supabase
    .from("services")
    .select("id, name, price")
    .eq("business_id", business.id)
    .eq("active", true)
    .order("name");

  return (
    <InvoicesClient
      initialInvoices={(invoices as any[]) || []}
      customers={customers || []}
      services={services || []}
      business={business}
    />
  );
}
