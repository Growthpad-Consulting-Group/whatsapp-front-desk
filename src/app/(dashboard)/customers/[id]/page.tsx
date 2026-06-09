import type { Metadata } from "next";
import { requireBusiness } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { CustomerDetailClient } from "./customer-detail-client";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Client Profile — CRM",
};

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const { business } = await requireBusiness();
  const supabase = await createClient();

  // 1. Fetch customer details
  const { data: customer, error: fetchErr } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (fetchErr || !customer) {
    notFound();
  }

  // 2. Fetch appointment records
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, services(*), staff_members(*)")
    .eq("customer_id", id)
    .order("start_at", { ascending: false });

  // 3. Fetch invoice logs
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  // 4. Fetch live chat conversation log
  const { data: messages } = await supabase
    .from("message_logs")
    .select("*")
    .eq("customer_id", id)
    .order("timestamp", { ascending: true });

  return (
    <CustomerDetailClient
      customer={customer}
      appointments={appointments || []}
      invoices={invoices || []}
      messages={messages || []}
      business={business}
    />
  );
}
