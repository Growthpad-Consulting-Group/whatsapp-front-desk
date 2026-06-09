import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "Set up your business — WhatsApp Front Desk",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // If they already have a business, skip onboarding
  const { data: staff } = await supabase
    .from("staff_members")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  if (staff) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary mb-4">
            <span className="text-primary-foreground text-xl">🏪</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            Tell us about your business
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This takes under 2 minutes. You can change everything later.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <OnboardingForm userName={user.user_metadata?.full_name} />
        </div>
      </div>
    </main>
  );
}
