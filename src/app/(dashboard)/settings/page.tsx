import { requireBusiness } from "@/lib/data/business";
import { BusinessProfileForm } from "./business-profile-form";

export const metadata = {
  title: "Business Profile — Settings",
};

export default async function SettingsGeneralPage() {
  const { business, staff } = await requireBusiness();
  const isOwner = staff.role === "owner";

  return <BusinessProfileForm business={business} isOwner={isOwner} />;
}
