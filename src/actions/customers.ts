"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/data/business";
import type { ActionResult } from "@/types";

export async function updateCustomerNotesAction(
  customerId: string,
  notes: string | null
): Promise<ActionResult> {
  try {
    const { business } = await requireBusiness();
    const supabase = await createClient();

    const { error } = await supabase
      .from("customers")
      .update({ notes: notes || null })
      .eq("id", customerId)
      .eq("business_id", business.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/customers");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateCustomerConsentAction(
  customerId: string,
  consentGiven: boolean
): Promise<ActionResult> {
  try {
    const { business } = await requireBusiness();
    const supabase = await createClient();

    const { error } = await supabase
      .from("customers")
      .update({ consent_given: consentGiven })
      .eq("id", customerId)
      .eq("business_id", business.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/customers");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
