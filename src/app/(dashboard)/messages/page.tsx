import { requireBusiness } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { MessagesClient } from "./messages-client";

export const metadata = {
  title: "Messages — WhatsApp Front Desk",
};

export default async function MessagesPage() {
  const { business } = await requireBusiness();
  const supabase = await createClient();

  // 1. Fetch sessions in human handoff state
  const { data: handoffData } = await supabase
    .from("conversation_sessions")
    .select("id, customer_phone, updated_at")
    .eq("business_id", business.id)
    .eq("state", "human_handoff")
    .order("updated_at", { ascending: false });

  let handoffs: any[] = [];
  if (handoffData && handoffData.length > 0) {
    const phones = handoffData.map((h) => h.customer_phone);
    const { data: customers } = await supabase
      .from("customers")
      .select("phone, name")
      .eq("business_id", business.id)
      .in("phone", phones);

    const customerMap = new Map(customers?.map((c) => [c.phone, c.name]) || []);
    handoffs = handoffData.map((h) => ({
      ...h,
      customers: customerMap.has(h.customer_phone)
        ? { name: customerMap.get(h.customer_phone) }
        : null,
    }));
  }

  // 2. Fetch message logs
  const { data: logs } = await supabase
    .from("message_logs")
    .select("id, direction, content_summary, status, timestamp, customer_id, customers(name, phone)")
    .eq("business_id", business.id)
    .order("timestamp", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Monitor real-time conversations, message logs, and human agent transfers.
        </p>
      </div>

      <MessagesClient
        handoffSessions={(handoffs as any) || []}
        messageLogs={(logs as any) || []}
        timezone={business.timezone}
      />
    </div>
  );
}
