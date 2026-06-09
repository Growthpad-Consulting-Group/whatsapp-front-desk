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
