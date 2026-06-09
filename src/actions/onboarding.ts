"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessProfileSchema } from "@/lib/validations/onboarding";
import type { ActionResult } from "@/types";

export async function createBusinessAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    industry: formData.get("industry"),
    timezone: formData.get("timezone"),
    currency: formData.get("currency"),
    whatsapp_number: formData.get("whatsapp_number"),
  };

  const parsed = BusinessProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if this user already has a business (prevent duplicate onboarding)
  const { data: existing } = await supabase
    .from("staff_members")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    redirect("/dashboard");
  }

  // Create the business
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .insert({
      name: parsed.data.name,
      industry: parsed.data.industry,
      timezone: parsed.data.timezone,
      currency: parsed.data.currency,
      whatsapp_number: parsed.data.whatsapp_number,
    })
    .select("id")
    .single();

  if (bizError || !business) {
    return { success: false, error: "Failed to create business. Please try again." };
  }

  // Create the owner staff member record linking auth user → business
  const { error: staffError } = await supabase
    .from("staff_members")
    .insert({
      business_id: business.id,
      user_id: user.id,
      name: user.user_metadata?.full_name ?? user.email ?? "Owner",
      email: user.email!,
      role: "owner",
      active: true,
    });

  if (staffError) {
    // Roll back the business if staff insert fails
    await supabase.from("businesses").delete().eq("id", business.id);
    return { success: false, error: "Failed to complete setup. Please try again." };
  }

  // Seed default templates, reminder rules, and operating hours
  // Uses the service role via a Supabase RPC call
  const { error: seedError } = await supabase.rpc("seed_business_defaults", {
    p_business_id: business.id,
  });

  if (seedError) {
    // Non-fatal — business is created, defaults can be added later
    console.error("[onboarding] seed_business_defaults failed:", seedError.message);
  }

  redirect("/dashboard");
}
