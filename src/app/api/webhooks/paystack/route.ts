import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { paystackProvider } from "@/lib/payments/paystack";
import { whatsappClient } from "@/lib/whatsapp/client";
import { formatCurrency } from "@/lib/utils";

// Helpers for template replacement
function fillTemplate(body: string, variables: Record<string, string>): string {
  let filled = body;
  for (const [key, val] of Object.entries(variables)) {
    filled = filled.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g"), val);
  }
  return filled;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-paystack-signature") || "";
  const rawBody = await request.text();

  // Validate webhook authenticity
  const isValid = paystackProvider.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    console.warn("[Paystack Webhook] Invalid webhook signature detected.");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err: any) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  // We only handle successful charges
  if (payload.event !== "charge.success") {
    return new NextResponse("Event ignored", { status: 200 });
  }

  const data = payload.data || {};
  const reference = data.reference;

  if (!reference) {
    return new NextResponse("Missing transaction reference", { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    // 1. Resolve payment request record
    const { data: payReq, error: payReqError } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("webhook_reference", reference)
      .single();

    if (payReqError || !payReq) {
      console.warn(`[Paystack Webhook] Payment request not found for reference: ${reference}`);
      return new NextResponse("Payment request not found", { status: 404 });
    }

    if (payReq.status === "paid") {
      // Already processed (idempotent response)
      return new NextResponse("Success", { status: 200 });
    }

    // 2. Mark payment request as paid
    await supabase
      .from("payment_requests")
      .update({ status: "paid" })
      .eq("id", payReq.id);

    // 3. Process Appointment Deposit Payment
    if (payReq.appointment_id) {
      const { data: appt, error: apptError } = await supabase
        .from("appointments")
        .select("*, services(*), businesses(*), customers(*), staff_members(*)")
        .eq("id", payReq.appointment_id)
        .single();

      if (apptError || !appt) {
        console.error(`[Paystack Webhook] Failed to fetch appointment: ${payReq.appointment_id}`);
        return new NextResponse("Appointment not found", { status: 404 });
      }

      const service = appt.services as any;
      const business = appt.businesses as any;
      const customer = appt.customers as any;
      const staff = appt.staff_members as any;

      // Update appointment status to confirmed & deposit_paid
      await supabase
        .from("appointments")
        .update({
          status: "confirmed",
          payment_status: "deposit_paid",
        })
        .eq("id", appt.id);

      // Google Calendar Sync
      if (staff && staff.calendar_connected) {
        try {
          const { createGoogleEvent } = await import("@/lib/calendar/google");
          const googleEventId = await createGoogleEvent(
            staff.id,
            appt.id,
            appt.start_at,
            appt.end_at,
            customer.name,
            service.name
          );
          if (googleEventId) {
            await supabase
              .from("appointments")
              .update({ google_event_id: googleEventId })
              .eq("id", appt.id);
          }
        } catch (err: any) {
          console.error("[Google Calendar Webhook Sync Failed]:", err.message);
        }
      }

      // Reset WhatsApp conversation session back to idle
      await supabase
        .from("conversation_sessions")
        .update({ state: "idle", context: {} })
        .eq("business_id", appt.business_id)
        .eq("customer_phone", customer.phone);

      // Send confirmation WhatsApp message
      const { data: template } = await supabase
        .from("message_templates")
        .select("body")
        .eq("business_id", appt.business_id)
        .eq("type", "booking_confirmed")
        .single();

      const startAt = new Date(appt.start_at);
      const templateBody =
        template?.body ||
        "Hi {{customer_name}}! Your booking for *{{service_name}}* is confirmed for {{date}} at {{time}}. Reply *R* to reschedule or *C* to cancel. — {{business_name}}";

      const messageContent = fillTemplate(templateBody, {
        customer_name: customer.name,
        service_name: service.name,
        date: startAt.toLocaleDateString("en-GB", { timeZone: business.timezone }),
        time: startAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: business.timezone }),
        business_name: business.name,
      });

      try {
        const { messageId } = await whatsappClient.sendText(customer.phone, messageContent);
        
        await supabase.from("message_logs").insert({
          business_id: appt.business_id,
          customer_id: customer.id,
          direction: "outbound",
          content_summary: messageContent.substring(0, 100),
          status: "sent",
          channel: "whatsapp",
          provider_message_id: messageId,
        });
      } catch (err: any) {
        console.error("[Paystack Webhook Callback WhatsApp Error]:", err.message);
      }
    }

    // 4. Process Invoice Payment
    if (payReq.invoice_id) {
      const { data: inv, error: invError } = await supabase
        .from("invoices")
        .select("*, customers(*), businesses(*)")
        .eq("id", payReq.invoice_id)
        .single();

      if (invError || !inv) {
        console.error(`[Paystack Webhook] Failed to fetch invoice: ${payReq.invoice_id}`);
        return new NextResponse("Invoice not found", { status: 404 });
      }

      const customer = inv.customers as any;
      const business = inv.businesses as any;

      // Update invoice as paid
      await supabase
        .from("invoices")
        .update({
          status: "paid",
          amount_paid: inv.amount,
        })
        .eq("id", inv.id);

      // If tied to an appointment, mark that appointment payment status as paid
      if (inv.appointment_id) {
        await supabase
          .from("appointments")
          .update({ payment_status: "paid" })
          .eq("id", inv.appointment_id);
      }

      // Send WhatsApp payment confirmation
      const startAt = new Date();
      const messageContent = `Hi ${customer.name}, we received your payment of ${formatCurrency(
        Number(inv.amount),
        business.currency
      )} for invoice ${inv.invoice_number}. Thank you for your business! — ${business.name}`;

      try {
        const { messageId } = await whatsappClient.sendText(customer.phone, messageContent);

        await supabase.from("message_logs").insert({
          business_id: inv.business_id,
          customer_id: customer.id,
          direction: "outbound",
          content_summary: messageContent.substring(0, 100),
          status: "sent",
          channel: "whatsapp",
          provider_message_id: messageId,
        });
      } catch (err: any) {
        console.error("[Paystack Webhook Invoice WhatsApp Confirmation Failed]:", err.message);
      }
    }

    return new NextResponse("Success", { status: 200 });
  } catch (err: any) {
    console.error("[Paystack Webhook processing error]:", err.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
