import { requireBusiness } from "@/lib/data/business";
import { WhatsAppConnectionCard } from "../whatsapp-connection-card";
import { PaystackConnectionCard } from "../paystack-connection-card";

export const metadata = {
  title: "Connections — Settings",
};

export default async function SettingsConnectionPage() {
  const { business, staff } = await requireBusiness();
  const isOwner = staff.role === "owner";

  return (
    <div className="max-w-2xl space-y-6">
      <WhatsAppConnectionCard business={business} isOwner={isOwner} />
      <PaystackConnectionCard business={business} isOwner={isOwner} />
    </div>
  );
}
