"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/data/business";
import {
  BusinessSettingsSchema,
  BusinessProfileSchema,
  BookingPoliciesSchema,
  OperatingHoursSchema,
} from "@/lib/validations/settings";
import type { ActionResult } from "@/types";

export async function updateBusinessSettingsAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    // Only owners can edit business-wide settings
    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can edit settings." };
    }

    const raw = {
      name: formData.get("name"),
      industry: formData.get("industry"),
      timezone: formData.get("timezone"),
      currency: formData.get("currency"),
      whatsapp_number: formData.get("whatsapp_number"),
      cancellation_hours: formData.get("cancellation_hours"),
      deposit_default_percent: formData.get("deposit_default_percent") || null,
    };

    const parsed = BusinessSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("businesses")
      .update({
        name: parsed.data.name,
        industry: parsed.data.industry,
        timezone: parsed.data.timezone,
        currency: parsed.data.currency,
        whatsapp_number: parsed.data.whatsapp_number,
        cancellation_hours: parsed.data.cancellation_hours,
        deposit_default_percent: parsed.data.deposit_default_percent,
      })
      .eq("id", business.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

// ─── Per-section focused actions ─────────────────────────────────────────────

/** Updates only identity + contact fields (name, industry, timezone, currency, whatsapp_number). */
export async function updateBusinessProfileAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();
    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can edit settings." };
    }

    const parsed = BusinessProfileSchema.safeParse({
      name: formData.get("name"),
      industry: formData.get("industry"),
      timezone: formData.get("timezone"),
      currency: formData.get("currency"),
      whatsapp_number: formData.get("whatsapp_number"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("businesses")
      .update(parsed.data)
      .eq("id", business.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

/** Updates only booking policy fields (cancellation_hours, deposit_default_percent). */
export async function updateBookingPoliciesAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();
    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can edit settings." };
    }

    const parsed = BookingPoliciesSchema.safeParse({
      cancellation_hours: formData.get("cancellation_hours"),
      deposit_default_percent: formData.get("deposit_default_percent") || null,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("businesses")
      .update(parsed.data)
      .eq("id", business.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateOperatingHoursAction(
  hours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can edit operating hours." };
    }

    const parsed = OperatingHoursSchema.safeParse(hours);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    // Prepare batch upsert
    const upsertData = parsed.data.map((h) => ({
      business_id: business.id,
      day_of_week: h.day_of_week,
      open_time: h.is_closed ? null : h.open_time || null,
      close_time: h.is_closed ? null : h.close_time || null,
      is_closed: h.is_closed,
    }));

    const { error } = await supabase
      .from("operating_hours")
      .upsert(upsertData, {
        onConflict: "business_id,day_of_week",
      });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateMessageTemplateAction(
  templateId: string | null,
  type: string,
  body: string,
  approvalStatus: "local" | "pending" | "approved" | "rejected" = "local"
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can edit message templates." };
    }

    const supabase = await createClient();

    if (templateId) {
      const { data, error } = await supabase
        .from("message_templates")
        .update({
          body,
          approval_status: approvalStatus,
        })
        .eq("id", templateId)
        .eq("business_id", business.id)
        .select("*")
        .single();

      if (error) return { success: false, error: error.message };
      
      // Trigger Audit Log
      try {
        const { createAuditLogAction } = await import("./audit");
        await createAuditLogAction("template_updated", templateId, { type });
      } catch (auditErr) {
        console.warn("Audit logging failed:", auditErr);
      }

      revalidatePath("/settings/templates");
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from("message_templates")
        .insert({
          business_id: business.id,
          type,
          body,
          approval_status: approvalStatus,
          language: "en",
        })
        .select("*")
        .single();

      if (error) return { success: false, error: error.message };

      // Trigger Audit Log
      try {
        const { createAuditLogAction } = await import("./audit");
        await createAuditLogAction("template_created", data.id, { type });
      } catch (auditErr) {
        console.warn("Audit logging failed:", auditErr);
      }

      revalidatePath("/settings/templates");
      return { success: true, data };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updatePaystackCredentialsAction(
  secretKey: string
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can update payment credentials." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("businesses")
      .update({ paystack_secret_key: secretKey.trim() || null })
      .eq("id", business.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateWhatsAppCredentialsAction(
  phoneNumberId: string,
  accessToken: string
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can update WhatsApp credentials." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("businesses")
      .update({
        whatsapp_phone_number_id: phoneNumberId.trim() || null,
        whatsapp_access_token:    accessToken.trim()    || null,
      })
      .eq("id", business.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
