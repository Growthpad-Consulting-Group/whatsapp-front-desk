import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createWhatsAppClient } from "@/lib/whatsapp/client";

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  const authHeader = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || authHeader !== process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  // Window: appointments that completed 24h–24h5m ago
  const windowEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const windowStart = new Date(windowEnd.getTime() - 5 * 60 * 1000);

  let sent = 0;

  try {
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, business_id, end_at, customers(id, name, phone), businesses(name, whatsapp_phone_number_id, whatsapp_access_token)")
      .eq("status", "completed")
      .gte("end_at", windowStart.toISOString())
      .lte("end_at", windowEnd.toISOString());

    if (error) {
      console.error("[Review Requests] Query error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const appt of appointments ?? []) {
      const customer = appt.customers as any;
      const business = appt.businesses as any;
      if (!customer?.phone || !business) continue;

      // Idempotency check
      const { data: alreadySent } = await supabase
        .from("reminder_sent_log")
        .select("id")
        .eq("business_id", appt.business_id)
        .eq("trigger", "post_visit_review")
        .eq("reference_id", appt.id)
        .maybeSingle();

      if (alreadySent) continue;

      // Use custom template if set, otherwise default
      const { data: template } = await supabase
        .from("message_templates")
        .select("body")
        .eq("business_id", appt.business_id)
        .eq("type", "post_visit_review")
        .maybeSingle();

      const msg = template?.body
        ? template.body.replace(/\{\{\s*customer_name\s*\}\}/g, customer.name).replace(/\{\{\s*business_name\s*\}\}/g, business.name)
        : `Hi ${customer.name}! Thank you for visiting ${business.name} today. We'd love to hear your feedback — it takes just a minute and means the world to us. 🙏`;

      try {
        const client = createWhatsAppClient(
          business.whatsapp_phone_number_id ?? "",
          business.whatsapp_access_token ?? ""
        );
        const { messageId } = await client.sendText(customer.phone, msg);

        await supabase.from("reminder_sent_log").insert({
          business_id: appt.business_id,
          trigger: "post_visit_review",
          reference_id: appt.id,
        });

        await supabase.from("message_logs").insert({
          business_id: appt.business_id,
          customer_id: customer.id,
          direction: "outbound",
          content_summary: msg.substring(0, 100),
          status: "sent",
          channel: "whatsapp",
          provider_message_id: messageId,
        });

        sent++;
      } catch (err: any) {
        console.error(`[Review Requests] Failed for appt ${appt.id}:`, err.message);
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (err: any) {
    console.error("[Review Requests] Unhandled error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
