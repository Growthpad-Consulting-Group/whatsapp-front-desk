import { requireBusiness } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { OperatingHoursForm } from "../operating-hours-form";

export const metadata = {
  title: "Operating Hours — Settings",
};

export default async function SettingsHoursPage() {
  const { business, staff } = await requireBusiness();
  const supabase = await createClient();

  const { data: operatingHours } = await supabase
    .from("operating_hours")
    .select("day_of_week, open_time, close_time, is_closed")
    .eq("business_id", business.id)
    .order("day_of_week");

  const isOwner = staff.role === "owner";

  return (
    <div className="max-w-2xl">
      <OperatingHoursForm
        initialHours={operatingHours || []}
        isOwner={isOwner}
      />
    </div>
  );
}
