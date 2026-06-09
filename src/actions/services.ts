"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/data/business";
import { ServiceSchema } from "@/lib/validations/settings";
import type { ActionResult } from "@/types";

export async function createServiceAction(
  rawInput: any
): Promise<ActionResult<string>> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can manage services." };
    }

    const parsed = ServiceSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .insert({
        business_id: business.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        duration_minutes: parsed.data.duration_minutes,
        price: parsed.data.price,
        deposit_required: parsed.data.deposit_required,
        deposit_amount: parsed.data.deposit_required ? parsed.data.deposit_amount : null,
        buffer_before_minutes: parsed.data.buffer_before_minutes,
        buffer_after_minutes: parsed.data.buffer_after_minutes,
        staff_id: parsed.data.staff_id || null,
        active: parsed.data.active,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath("/settings/services");
    return { success: true, data: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateServiceAction(
  id: string,
  rawInput: any
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can manage services." };
    }

    const parsed = ServiceSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("services")
      .update({
        name: parsed.data.name,
        description: parsed.data.description || null,
        duration_minutes: parsed.data.duration_minutes,
        price: parsed.data.price,
        deposit_required: parsed.data.deposit_required,
        deposit_amount: parsed.data.deposit_required ? parsed.data.deposit_amount : null,
        buffer_before_minutes: parsed.data.buffer_before_minutes,
        buffer_after_minutes: parsed.data.buffer_after_minutes,
        staff_id: parsed.data.staff_id || null,
        active: parsed.data.active,
      })
      .eq("id", id)
      .eq("business_id", business.id); // defence-in-depth

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath("/settings/services");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function toggleServiceActiveAction(
  id: string,
  active: boolean
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can manage services." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("services")
      .update({ active })
      .eq("id", id)
      .eq("business_id", business.id); // defence-in-depth

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath("/settings/services");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
