import { requireBusiness } from "@/lib/data/business";
import { WhatsAppConnectionCard } from "../whatsapp-connection-card";

export const metadata = {
  title: "WhatsApp Connection — Settings",
};

export default async function SettingsConnectionPage() {
  const { business, staff } = await requireBusiness();
  const isOwner = staff.role === "owner";

  return (
    <div className="max-w-2xl">
      <WhatsAppConnectionCard business={business} isOwner={isOwner} />
    </div>
  );
}
