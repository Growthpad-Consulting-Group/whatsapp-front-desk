"use server";

import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments/provider";

export async function createPaymentLinkAction(
  appointmentId: string | null,
  invoiceId: string | null,
  amount: number,
  currency: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const adminSupabase = createAdminClient();

    // Fetch customer details (email or default placeholder)
    let email = "customer@whatsapp.business.flow";
    let businessId: string | null = null;
    let customerName = "Client";

    if (appointmentId) {
      const { data: appt } = await adminSupabase
        .from("appointments")
        .select("*, customers(*)")
        .eq("id", appointmentId)
        .single();
      
      if (!appt) {
        return { success: false, error: "Appointment not found." };
      }
      
      businessId = appt.business_id;
      if (appt.customers?.email) {
        email = appt.customers.email;
      } else if (appt.customers?.phone) {
        email = `${appt.customers.phone.replace(/\D/g, "")}@whatsapp.business.flow`;
      }
      customerName = appt.customers?.name || "Client";
    } else if (invoiceId) {
      const { data: inv } = await adminSupabase
        .from("invoices")
        .select("*, customers(*)")
        .eq("id", invoiceId)
        .single();
      
      if (!inv) {
        return { success: false, error: "Invoice not found." };
      }
      
      businessId = inv.business_id;
      if (inv.customers?.email) {
        email = inv.customers.email;
      } else if (inv.customers?.phone) {
        email = `${inv.customers.phone.replace(/\D/g, "")}@whatsapp.business.flow`;
      }
      customerName = inv.customers?.name || "Client";
    }

    if (!businessId) {
      return { success: false, error: "Could not resolve business details." };
    }

    // Check if a pending payment request already exists and is less than 2 hours old
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const query = adminSupabase
      .from("payment_requests")
      .select("*")
      .eq("business_id", businessId)
      .eq("status", "pending")
      .gte("created_at", twoHoursAgo)
      .order("created_at", { ascending: false })
      .limit(1);

    if (appointmentId) {
      query.eq("appointment_id", appointmentId);
    } else if (invoiceId) {
      query.eq("invoice_id", invoiceId);
    }

    const { data: existingReq } = await query.maybeSingle();

    if (existingReq) {
      return { success: true, url: existingReq.link };
    }

    // Initialize payment transaction with active provider
    const provider = await getPaymentProvider("paystack");
    const reference = `pay_req_${crypto.randomUUID()}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/status`;

    const initResult = await provider.initializeTransaction({
      email,
      amount,
      currency,
      reference,
      callbackUrl,
      metadata: {
        appointmentId,
        invoiceId,
        businessId,
        customerName,
      },
    });

    // Save payment request details
    const { error: insertError } = await adminSupabase
      .from("payment_requests")
      .insert({
        business_id: businessId,
        appointment_id: appointmentId || null,
        invoice_id: invoiceId || null,
        provider: "paystack",
        link: initResult.authorizationUrl,
        amount,
        currency,
        status: "pending",
        webhook_reference: reference, // maps callback transaction
      });

    if (insertError) {
      console.error("Failed to insert payment request:", insertError.message);
      return { success: false, error: insertError.message };
    }

    return { success: true, url: initResult.authorizationUrl };
  } catch (err: any) {
    console.error("Failed to create payment link:", err.message);
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
