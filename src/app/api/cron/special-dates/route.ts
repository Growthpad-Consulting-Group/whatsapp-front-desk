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
  const today = new Date();
  // Zero-pad month and day for SQL comparison (e.g. "06" and "10")
  const todayMonth = String(today.getUTCMonth() + 1).padStart(2, "0");
  const todayDay = String(today.getUTCDate()).padStart(2, "0");
  const thisYear = today.getUTCFullYear();

  let sent = 0;

  try {
    // Fetch all active customers who have a birthday or anniversary today (any year stored)
    const { data: customers, error } = await supabase
      .from("customers")
      .select("id, name, phone, birthday, anniversary, business_id, businesses(name, currency, whatsapp_phone_number_id, whatsapp_access_token)")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .not("birthday", "is", null) as any;

    if (error) {
      console.error("[Special-Dates Cron] Query error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also fetch anniversary customers separately and merge
    const { data: anniversaryCustomers } = await supabase
      .from("customers")
      .select("id, name, phone, birthday, anniversary, business_id, businesses(name, currency, whatsapp_phone_number_id, whatsapp_access_token)")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .not("anniversary", "is", null) as any;

    const allCustomers: any[] = [
      ...(customers ?? []),
      ...(anniversaryCustomers ?? []),
    ];
    // Deduplicate by id
    const seen = new Set<string>();
    const uniqueCustomers = allCustomers.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    for (const c of uniqueCustomers) {
      const business = c.businesses as any;
      if (!business) continue;

      // Check birthday
      if (c.birthday) {
        const [, bMonth, bDay] = (c.birthday as string).split("-");
        if (bMonth === todayMonth && bDay === todayDay) {
          const idempotencyKey = `${c.id}_${thisYear}`;
          const { data: alreadySent } = await supabase
            .from("reminder_sent_log")
            .select("id")
            .eq("business_id", c.business_id)
            .eq("trigger", "birthday_annual")
            .eq("reference_id", idempotencyKey)
            .maybeSingle();

          if (!alreadySent) {
            const msg = `🎂 Happy Birthday, ${c.name}! Wishing you a wonderful day from all of us at ${business.name}. We appreciate your loyalty and hope to see you soon! 🎉`;
            try {
              await createWhatsAppClient(
                business.whatsapp_phone_number_id ?? "",
                business.whatsapp_access_token ?? ""
              ).sendText(c.phone, msg);
              await supabase.from("reminder_sent_log").insert({
                business_id: c.business_id,
                trigger: "birthday_annual",
                reference_id: idempotencyKey,
              });
              await supabase.from("message_logs").insert({
                business_id: c.business_id,
                customer_id: c.id,
                direction: "outbound",
                content_summary: msg.substring(0, 100),
                status: "sent",
                channel: "whatsapp",
              });
              sent++;
            } catch (err: any) {
              console.error(`[Special-Dates] Birthday send failed for ${c.id}:`, err.message);
            }
          }
        }
      }

      // Check anniversary
      if (c.anniversary) {
        const [, aMonth, aDay] = (c.anniversary as string).split("-");
        if (aMonth === todayMonth && aDay === todayDay) {
          const idempotencyKey = `${c.id}_${thisYear}`;
          const { data: alreadySent } = await supabase
            .from("reminder_sent_log")
            .select("id")
            .eq("business_id", c.business_id)
            .eq("trigger", "anniversary_annual")
            .eq("reference_id", idempotencyKey)
            .maybeSingle();

          if (!alreadySent) {
            const msg = `💐 Happy Anniversary, ${c.name}! Thank you for being a valued client at ${business.name}. We hope this special day is everything you deserve! 🥂`;
            try {
              await createWhatsAppClient(
                business.whatsapp_phone_number_id ?? "",
                business.whatsapp_access_token ?? ""
              ).sendText(c.phone, msg);
              await supabase.from("reminder_sent_log").insert({
                business_id: c.business_id,
                trigger: "anniversary_annual",
                reference_id: idempotencyKey,
              });
              await supabase.from("message_logs").insert({
                business_id: c.business_id,
                customer_id: c.id,
                direction: "outbound",
                content_summary: msg.substring(0, 100),
                status: "sent",
                channel: "whatsapp",
              });
              sent++;
            } catch (err: any) {
              console.error(`[Special-Dates] Anniversary send failed for ${c.id}:`, err.message);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (err: any) {
    console.error("[Special-Dates Cron] Unhandled error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
