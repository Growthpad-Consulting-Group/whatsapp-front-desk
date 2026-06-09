"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/data/business";
import { StaffSchema } from "@/lib/validations/settings";
import type { ActionResult } from "@/types";

export async function createStaffAction(
  rawInput: any
): Promise<ActionResult<string>> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can manage staff members." };
    }

    const parsed = StaffSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("staff_members")
      .insert({
        business_id: business.id,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        role: parsed.data.role,
        active: parsed.data.active,
        calendar_connected: false,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath("/settings/staff");
    return { success: true, data: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateStaffAction(
  id: string,
  rawInput: any
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can manage staff members." };
    }

    const parsed = StaffSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("staff_members")
      .update({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        role: parsed.data.role,
        active: parsed.data.active,
      })
      .eq("id", id)
      .eq("business_id", business.id); // defence-in-depth

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath("/settings/staff");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function toggleStaffActiveAction(
  id: string,
  active: boolean
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can manage staff members." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("staff_members")
      .update({ active })
      .eq("id", id)
      .eq("business_id", business.id); // defence-in-depth

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath("/settings/staff");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function disconnectCalendarAction(
  staffId: string
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    const supabase = await createClient();
    const { data: targetStaff } = await supabase
      .from("staff_members")
      .select("id, user_id, business_id")
      .eq("id", staffId)
      .single();

    if (!targetStaff) {
      return { success: false, error: "Staff member not found." };
    }

    if (targetStaff.business_id !== business.id) {
      return { success: false, error: "Forbidden: Cross-business operation." };
    }

    if (staff.role !== "owner" && targetStaff.user_id !== staff.user_id) {
      return { success: false, error: "Forbidden: You can only disconnect your own calendar." };
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("staff_members")
      .update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expires_at: null,
        calendar_connected: false,
      })
      .eq("id", staffId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath("/settings/staff");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
