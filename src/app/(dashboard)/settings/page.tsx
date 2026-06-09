import { requireBusiness } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { BusinessProfileForm } from "./business-profile-form";
import { OperatingHoursForm } from "./operating-hours-form";

export const metadata = {
  title: "General Settings & Hours",
};

export default async function SettingsGeneralPage() {
  const { business, staff } = await requireBusiness();
  const supabase = await createClient();

  const { data: operatingHours } = await supabase
    .from("operating_hours")
    .select("day_of_week, open_time, close_time, is_closed")
    .eq("business_id", business.id)
    .order("day_of_week");

  const isOwner = staff.role === "owner";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      <div className="xl:col-span-2 space-y-6">
        <BusinessProfileForm business={business} isOwner={isOwner} />
      </div>
      <div>
        <OperatingHoursForm
          initialHours={operatingHours || []}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
