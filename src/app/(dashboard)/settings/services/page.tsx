import { requireBusiness } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { ServicesClient } from "./services-client";

export const metadata = {
  title: "Service Catalogue — WhatsApp Front Desk",
};

export default async function ServicesPage() {
  const { business, staff } = await requireBusiness();
  const supabase = await createClient();

  // Fetch services belonging to this business, along with assigned staff details
  const { data: services } = await supabase
    .from("services")
    .select("*, staff_members(name)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  // Fetch active staff members for dropdown allocation
  const { data: staffMembers } = await supabase
    .from("staff_members")
    .select("id, name")
    .eq("business_id", business.id)
    .eq("active", true)
    .order("name");

  const isOwner = staff.role === "owner";

  return (
    <ServicesClient
      initialServices={(services as any) || []}
      staffMembers={staffMembers || []}
      currency={business.currency}
      isOwner={isOwner}
    />
  );
}
