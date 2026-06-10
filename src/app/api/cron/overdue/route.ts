import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createWhatsAppClient } from "@/lib/whatsapp/client";
import { createInvoiceAction } from "@/actions/invoices";
import { formatCurrency } from "@/lib/utils";

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
  const now = new Date();
  const nowStr = now.toISOString();

  try {
    // ----------------------------------------------------
    // SECTION 1: Auto-Complete Past Confirmed Appointments
    // ----------------------------------------------------
    const { data: pastAppts, error: apptsError } = await supabase
      .from("appointments")
      .select("id")
      .eq("status", "confirmed")
      .lt("end_at", nowStr);

    let completedCount = 0;
    if (pastAppts && pastAppts.length > 0) {
      for (const appt of pastAppts) {
        // Mark status as completed
        const { error: updateError } = await supabase
          .from("appointments")
          .update({ status: "completed" })
          .eq("id", appt.id);

        if (!updateError) {
          completedCount++;
          // Generate draft invoice automatically!
          try {
            await createInvoiceAction(appt.id);
          } catch (invErr: any) {
            console.error(`[Cron Auto-Invoice Failed] Appt ID: ${appt.id}:`, invErr.message);
          }
        }
      }
    }

    // ----------------------------------------------------
    // SECTION 2: Process Overdue Invoice Reminders
    // ----------------------------------------------------
    const { data: activeInvoices, error: invsError } = await supabase
      .from("invoices")
      .select("*, customers(*), businesses(*)")
      .in("status", ["sent", "due", "overdue", "partially_paid"])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("reminders_paused" as any, false);

    if (invsError) {
      console.error("[Cron Overdue Invoice Query Error]:", invsError.message);
      return NextResponse.json({ error: invsError.message }, { status: 500 });
    }

    let remindersSentCount = 0;

    if (activeInvoices && activeInvoices.length > 0) {
      for (const _inv of activeInvoices) {
        const inv = _inv as typeof _inv & { promise_date?: string | null };
        const customer = inv.customers as any;
        const business = inv.businesses as any;

        if (!customer || !business) continue;

        const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Skip invoices where customer has made a payment promise that hasn't expired yet
        if (inv.promise_date) {
          const promiseDateOnly = new Date(inv.promise_date);
          if (promiseDateOnly >= todayDateOnly) continue;
        }

        const dueDate = new Date(inv.due_date);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        const diffTime = todayDateOnly.getTime() - dueDateOnly.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let trigger: "invoice_due" | "invoice_overdue_1_3" | "invoice_overdue_4_7" | "invoice_overdue_8plus" | null = null;
        let overdueLabel = "";

        if (diffDays === 0) {
          trigger = "invoice_due";
          overdueLabel = "is due today";
        } else if (diffDays >= 1 && diffDays <= 3) {
          trigger = "invoice_overdue_1_3";
          overdueLabel = `is ${diffDays} day(s) overdue`;
        } else if (diffDays >= 4 && diffDays <= 7) {
          trigger = "invoice_overdue_4_7";
          overdueLabel = `is ${diffDays} day(s) overdue`;
        } else if (diffDays >= 8) {
          trigger = "invoice_overdue_8plus";
          overdueLabel = `is ${diffDays} days overdue`;
        }

        if (!trigger) continue;

        // Verify idempotency check
        const { data: alreadySent } = await supabase
          .from("reminder_sent_log")
          .select("id")
          .eq("business_id", inv.business_id)
          .eq("trigger", trigger)
          .eq("reference_id", inv.id)
          .maybeSingle();

        if (alreadySent) continue;

        // Build reminder message
        const amountOutstanding = Number(inv.amount) - Number(inv.amount_paid);
        const invoiceLink = `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${inv.id}`;

        const messageText = trigger === "invoice_overdue_8plus"
          ? `Hi ${customer.name}, this is an urgent notice that invoice ${inv.invoice_number} for ${formatCurrency(amountOutstanding, business.currency)} ${overdueLabel} and remains unpaid. Please settle this immediately or contact us to arrange payment: ${invoiceLink} — ${business.name}`
          : `Hi ${customer.name}, here is a friendly reminder that invoice ${inv.invoice_number} for ${formatCurrency(amountOutstanding, business.currency)} ${overdueLabel}. Please view details and complete your payment here: ${invoiceLink} — ${business.name}`;

        try {
          const { messageId } = await createWhatsAppClient(
            business.whatsapp_phone_number_id ?? "",
            business.whatsapp_access_token ?? ""
          ).sendText(customer.phone, messageText);

          // Log in reminder sent log
          await supabase.from("reminder_sent_log").insert({
            business_id: inv.business_id,
            trigger,
            reference_id: inv.id,
          });

          // Log message
          await supabase.from("message_logs").insert({
            business_id: inv.business_id,
            customer_id: customer.id,
            direction: "outbound",
            content_summary: messageText.substring(0, 100),
            status: "sent",
            channel: "whatsapp",
            provider_message_id: messageId,
          });

          remindersSentCount++;
        } catch (sendErr: any) {
          console.error(`[Cron Send Overdue Failed] Invoice ID ${inv.id}:`, sendErr.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      autoCompletedBookings: completedCount,
      remindersSent: remindersSentCount,
    });
  } catch (err: any) {
    console.error("[Overdue Cron handler failure]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
