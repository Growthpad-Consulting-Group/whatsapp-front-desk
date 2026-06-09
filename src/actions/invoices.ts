"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/data/business";
import { createAuditLogAction } from "@/actions/audit";
import { whatsappClient } from "@/lib/whatsapp/client";
import { formatCurrency } from "@/lib/utils";
import type { ActionResult } from "@/types";

export async function createInvoiceAction(appointmentId: string): Promise<any> {
  const supabase = await createClient();

  // Check if invoice already exists
  const { data: existingInv } = await supabase
    .from("invoices")
    .select("*")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (existingInv) {
    return existingInv;
  }

  // Fetch appointment with service, customer, and business details
  const { data: appt, error: apptError } = await supabase
    .from("appointments")
    .select("*, services(*), businesses(*), customers(*)")
    .eq("id", appointmentId)
    .single();

  if (apptError || !appt) {
    throw new Error(`Appointment not found: ${apptError?.message}`);
  }

  const service = appt.services as any;
  const business = appt.businesses as any;
  const customer = appt.customers as any;

  if (!service || !business) {
    throw new Error("Could not resolve service or business parameters.");
  }

  // Calculate invoice amount subtracting any deposit paid
  let amount = Number(service.price);
  if (appt.payment_status === "deposit_paid") {
    let depositAmount = 0;
    if (service.deposit_required && service.deposit_amount) {
      depositAmount = Number(service.deposit_amount);
    } else if (business.deposit_default_percent) {
      depositAmount = (Number(service.price) * Number(business.deposit_default_percent)) / 100;
    }
    amount = Math.max(0, amount - depositAmount);
  }

  // Call Supabase sequence generator to get an invoice number
  let invoiceNumber = "";
  try {
    const { data: generatedNum } = await supabase.rpc("generate_invoice_number", {
      p_business_id: appt.business_id,
    });
    invoiceNumber = generatedNum || `INV-${Math.floor(10000 + Math.random() * 90000)}`;
  } catch {
    invoiceNumber = `INV-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  const dueDate = new Date(appt.start_at).toISOString().split("T")[0];

  // Insert the draft invoice
  const { data: invoice, error: insertError } = await supabase
    .from("invoices")
    .insert({
      business_id: appt.business_id,
      customer_id: appt.customer_id,
      appointment_id: appt.id,
      invoice_number: invoiceNumber,
      amount,
      amount_paid: 0,
      currency: business.currency || "KES",
      due_date: dueDate,
      status: "draft",
    })
    .select("*")
    .single();

  if (insertError) {
    throw new Error(`Failed to create draft invoice: ${insertError.message}`);
  }

  revalidatePath("/invoices");
  return invoice;
}

export async function sendInvoiceAction(invoiceId: string): Promise<ActionResult> {
  try {
    const { business } = await requireBusiness();
    const supabase = await createClient();

    const { data: inv, error: fetchError } = await supabase
      .from("invoices")
      .select("*, customers(*)")
      .eq("id", invoiceId)
      .eq("business_id", business.id)
      .single();

    if (fetchError || !inv) {
      return { success: false, error: "Invoice not found." };
    }

    const customer = inv.customers as any;
    if (!customer) {
      return { success: false, error: "Associated customer not found." };
    }

    // Update status to sent
    await supabase
      .from("invoices")
      .update({ status: "sent" })
      .eq("id", inv.id);

    const invoiceLink = `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${inv.id}`;
    const amountOutstanding = Number(inv.amount) - Number(inv.amount_paid);

    const messageContent = `Hi ${customer.name}, here is your invoice ${inv.invoice_number} for ${formatCurrency(
      amountOutstanding,
      inv.currency
    )} due on ${inv.due_date}. You can view the details and pay online here: ${invoiceLink} — ${business.name}`;

    try {
      const { messageId } = await whatsappClient.sendText(customer.phone, messageContent);

      await supabase.from("message_logs").insert({
        business_id: business.id,
        customer_id: customer.id,
        direction: "outbound",
        content_summary: messageContent.substring(0, 100),
        status: "sent",
        channel: "whatsapp",
        provider_message_id: messageId,
      });
    } catch (sendErr: any) {
      return { success: false, error: `Invoice status updated but WhatsApp alert failed: ${sendErr.message}` };
    }

    await createAuditLogAction("invoice.sent", inv.id, {
      invoice_number: inv.invoice_number,
      amount: inv.amount,
      customer: customer.name,
    });

    revalidatePath("/invoices");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function markInvoicePaymentAction(
  invoiceId: string,
  amount: number,
  paymentStatus: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const { business } = await requireBusiness();
    const supabase = await createClient();

    const { data: inv, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("business_id", business.id)
      .single();

    if (fetchError || !inv) {
      return { success: false, error: "Invoice not found." };
    }

    const newAmountPaid = Number(inv.amount_paid) + amount;
    const finalStatus = newAmountPaid >= Number(inv.amount) ? "paid" : "partially_paid";

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        amount_paid: newAmountPaid,
        status: paymentStatus === "paid" ? finalStatus : (paymentStatus as any),
        notes: notes || inv.notes,
      })
      .eq("id", invoiceId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // If fully paid, update linked appointment payment status to paid
    if (finalStatus === "paid" && inv.appointment_id) {
      await supabase
        .from("appointments")
        .update({ payment_status: "paid" })
        .eq("id", inv.appointment_id);
    }

    await createAuditLogAction("invoice.payment_recorded", invoiceId, {
      amount_recorded: amount,
      new_status: paymentStatus === "paid" ? finalStatus : paymentStatus,
      invoice_number: inv.invoice_number,
    });

    revalidatePath("/invoices");
    revalidatePath("/bookings");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function createManualInvoiceAction(
  customerId: string,
  amount: number,
  dueDate: string,
  notes?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { business } = await requireBusiness();
    const supabase = await createClient();

    let invoiceNumber = "";
    try {
      const { data: generatedNum } = await supabase.rpc("generate_invoice_number", {
        p_business_id: business.id,
      });
      invoiceNumber = generatedNum || `INV-${Math.floor(10000 + Math.random() * 90000)}`;
    } catch {
      invoiceNumber = `INV-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    const { data: newInvoice, error: insertError } = await supabase
      .from("invoices")
      .insert({
        business_id: business.id,
        customer_id: customerId,
        invoice_number: invoiceNumber,
        amount,
        amount_paid: 0,
        currency: business.currency || "KES",
        due_date: dueDate,
        status: "draft",
        notes: notes || null,
      })
      .select("*")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    revalidatePath("/invoices");
    return { success: true, data: newInvoice };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
