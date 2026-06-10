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
  const localSecret = process.env.CRON_SECRET;

  if (!localSecret || authHeader !== localSecret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  try {
    // Fetch pending appointments created over 15 minutes ago
    const { data: expiredAppts, error: fetchError } = await supabase
      .from("appointments")
      .select("*, customers(*), services(*), businesses(*)")
      .eq("status", "pending")
      .eq("payment_status", "deposit_pending")
      .lt("created_at", fifteenMinutesAgo);

    if (fetchError) {
      console.error("[Deposit Hold Cron Fetch Error]:", fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!expiredAppts || expiredAppts.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    let cancelledCount = 0;

    for (const appt of expiredAppts) {
      const customer = appt.customers as any;
      const service = appt.services as any;
      const business = appt.businesses as any;

      if (!customer || !service || !business) continue;

      // 1. Cancel the appointment
      const { error: cancelError } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appt.id);

      if (cancelError) {
        console.error(`[Cron Cancel Failed] Appt ID: ${appt.id}:`, cancelError.message);
        continue;
      }

      // 2. Reset conversation session to idle
      await supabase
        .from("conversation_sessions")
        .update({ state: "idle", context: {} })
        .eq("business_id", appt.business_id)
        .eq("customer_phone", customer.phone);

      // 3. Notify customer via WhatsApp
      const notifyMessage = `Hi ${customer.name}, your booking request for *${service.name}* has timed out because we did not receive the required deposit within our 15-minute window. Please reply to this chat if you would like to start a new booking. — ${business.name}`;

      try {
        const { messageId } = await createWhatsAppClient(
          business.whatsapp_phone_number_id ?? "",
          business.whatsapp_access_token ?? ""
        ).sendText(customer.phone, notifyMessage);

        await supabase.from("message_logs").insert({
          business_id: appt.business_id,
          customer_id: customer.id,
          direction: "outbound",
          content_summary: notifyMessage.substring(0, 100),
          status: "sent",
          channel: "whatsapp",
          provider_message_id: messageId,
        });

        cancelledCount++;
      } catch (err: any) {
        console.error(`[Cron Cancel WhatsApp Failed] Appt ID ${appt.id}:`, err.message);
      }
    }

    return NextResponse.json({ success: true, count: cancelledCount });
  } catch (err: any) {
    console.error("[Deposit Hold Cron handler failure]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
