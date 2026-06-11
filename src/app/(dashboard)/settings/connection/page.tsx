import { requireBusiness } from "@/lib/data/business";
import { WhatsAppConnectionCard } from "../whatsapp-connection-card";
import { PaystackConnectionCard } from "../paystack-connection-card";
import { ConnectionsGuide } from "./connections-guide";

export const metadata = {
  title: "Connections — Settings",
};

export default async function SettingsConnectionPage() {
  const { business, staff } = await requireBusiness();
  const isOwner = staff.role === "owner";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Connections</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Connect your WhatsApp and payment accounts.</p>
        </div>
        <ConnectionsGuide />
      </div>
      <WhatsAppConnectionCard business={business} isOwner={isOwner} />
      <PaystackConnectionCard business={business} isOwner={isOwner} />
    </div>
  );
}
