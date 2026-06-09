import type { Metadata } from "next";
import { requireBusiness } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { TemplatesClient } from "./templates-client";

export const metadata: Metadata = {
  title: "Message Templates — Settings",
};

export default async function SettingsTemplatesPage() {
  const { business } = await requireBusiness();
  const supabase = await createClient();

  // Load message templates for the current business
  const { data: templates } = await supabase
    .from("message_templates")
    .select("*")
    .eq("business_id", business.id);

  return (
    <TemplatesClient
      initialTemplates={(templates as any[]) || []}
      business={business}
    />
  );
}
