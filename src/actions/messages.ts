"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/data/business";
import type { ActionResult } from "@/types";

export async function releaseHandoffAction(
  customerPhone: string
): Promise<ActionResult> {
  try {
    const { business } = await requireBusiness();
    const supabase = await createClient();

    const { error } = await supabase
      .from("conversation_sessions")
      .update({
        state: "idle",
        context: {},
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .eq("business_id", business.id)
      .eq("customer_phone", customerPhone);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/messages");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function sendMessageAction(
  customerPhone: string,
  body: string
): Promise<ActionResult> {
  try {
    const { business } = await requireBusiness();
    const supabase = await createClient();

    // 1. Find the customer
    let { data: customer } = await supabase
      .from("customers")
      .select("id, name")
      .eq("business_id", business.id)
      .eq("phone", customerPhone)
      .single();

    if (!customer) {
      const { data: newCustomer, error: createError } = await supabase
        .from("customers")
        .insert({
          business_id: business.id,
          phone: customerPhone,
          name: "Client",
        })
        .select("id, name")
        .single();

      if (createError) {
        return { success: false, error: createError.message };
      }
      customer = newCustomer;
    }

    // 2. Instantiate whatsapp client
    const { createWhatsAppClient } = await import("@/lib/whatsapp/client");
    const whatsapp = createWhatsAppClient(
      business.whatsapp_phone_number_id ?? "",
      business.whatsapp_access_token ?? ""
    );

    // 3. Send message via WhatsApp API
    const { messageId } = await whatsapp.sendText(customerPhone, body);

    // 4. Log message to database
    const { error: logError } = await supabase
      .from("message_logs")
      .insert({
        business_id: business.id,
        customer_id: customer.id,
        direction: "outbound",
        content_summary: body,
        status: "sent",
        channel: "whatsapp",
        provider_message_id: messageId,
      });

    if (logError) {
      return { success: false, error: logError.message };
    }

    revalidatePath("/messages");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
