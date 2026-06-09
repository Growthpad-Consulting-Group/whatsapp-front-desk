import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { whatsappClient } from "@/lib/whatsapp/client";
import { formatCurrency } from "@/lib/utils";

function fillTemplate(body: string, variables: Record<string, string>): string {
  let filled = body;
  for (const [key, val] of Object.entries(variables)) {
    filled = filled.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g"), val);
  }
  return filled;
}

function formatLocalTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatLocalDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const requestSecret = request.headers.get("x-cron-secret");

    if (!cronSecret || requestSecret !== cronSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = createAdminClient();

    // Define scanning boundaries
    const now = new Date();
    
    // 24-hour window: starting 24h to 24h 5m from now
    const win24tStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const win24tEnd = new Date(win24tStart.getTime() + 5 * 60 * 1000);

    // 2-hour window: starting 2h to 2h 5m from now
    const win2tStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const win2tEnd = new Date(win2tStart.getTime() + 5 * 60 * 1000);

    const triggers = [
      { name: "24h_before", start: win24tStart, end: win24tEnd },
      { name: "2h_before", start: win2tStart, end: win2tEnd },
    ];

    const results = [];

    for (const trigger of triggers) {
      // Query confirmed appointments in this timeframe
      const { data: appts, error: apptsError } = await supabase
        .from("appointments")
        .select("*, customers(*), services(*), businesses(*)")
        .eq("status", "confirmed")
        .gte("start_at", trigger.start.toISOString())
        .lte("start_at", trigger.end.toISOString());

      if (apptsError) {
        console.error(`Error querying appointments for trigger ${trigger.name}:`, apptsError.message);
        continue;
      }

      if (!appts || appts.length === 0) continue;

      for (const appt of appts) {
        const customer = appt.customers as any;
        const service = appt.services as any;
        const business = appt.businesses as any;

        if (!customer || !service || !business) continue;

        // Check if reminder was already sent (idempotency check)
        const { data: alreadySent } = await supabase
          .from("reminder_sent_log")
          .select("id")
          .eq("business_id", appt.business_id)
          .eq("trigger", trigger.name)
          .eq("reference_id", appt.id)
          .maybeSingle();

        if (alreadySent) {
          console.log(`Reminder ${trigger.name} already sent for appointment ${appt.id}. Skipping.`);
          continue;
        }

        // Fetch reminder rules for the business and trigger type
        const { data: rule } = await supabase
          .from("reminder_rules")
          .select("*, message_templates(body)")
          .eq("business_id", appt.business_id)
          .eq("trigger", trigger.name)
          .eq("active", true)
          .maybeSingle();

        // If rule or template is not found/active, use default templates
        const defaultTemplates: Record<string, string> = {
          "24h_before": "Hi {{customer_name}}, this is a reminder of your booking for *{{service_name}}* tomorrow at {{time}}. Reply *R* to reschedule or *C* to cancel. — {{business_name}}",
          "2h_before": "Hi {{customer_name}}, your appointment for *{{service_name}}* is in 2 hours at {{time}}. See you soon! — {{business_name}}",
        };

        const templateBody = (rule?.message_templates as any)?.body || defaultTemplates[trigger.name];
        if (!templateBody) continue;

        const startAtDate = new Date(appt.start_at);
        const formattedDate = formatLocalDate(startAtDate, business.timezone);
        const formattedTime = formatLocalTime(startAtDate, business.timezone);

        const outboundBody = fillTemplate(templateBody, {
          customer_name: customer.name,
          service_name: service.name,
          date: formattedDate,
          time: formattedTime,
          business_name: business.name,
        });

        try {
          // Send message
          const { messageId } = await whatsappClient.sendText(customer.phone, outboundBody);

          // Log message to DB logs
          await supabase.from("message_logs").insert({
            business_id: appt.business_id,
            customer_id: customer.id,
            direction: "outbound",
            content_summary: outboundBody.substring(0, 100),
            status: "sent",
            channel: "whatsapp",
            provider_message_id: messageId,
          });

          // Log reminder to idempotency log
          await supabase.from("reminder_sent_log").insert({
            business_id: appt.business_id,
            trigger: trigger.name,
            reference_id: appt.id,
          });

          results.push({ appointmentId: appt.id, trigger: trigger.name, status: "sent" });
        } catch (err: any) {
          console.error(`Failed to send reminder to ${customer.phone} for appointment ${appt.id}:`, err.message);
        }
      }
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (err: any) {
    console.error("[Reminders Cron Error]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
