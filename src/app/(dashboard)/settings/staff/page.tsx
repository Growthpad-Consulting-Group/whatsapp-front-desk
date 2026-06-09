import { requireBusiness } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { StaffClient } from "./staff-client";

export const metadata = {
  title: "Staff Members — WhatsApp Front Desk",
};

export default async function StaffPage() {
  const { business, staff } = await requireBusiness();
  const supabase = await createClient();

  const { data: staffMembers } = await supabase
    .from("staff_members")
    .select("*")
    .eq("business_id", business.id)
    .order("role", { ascending: true }) // owners first
    .order("name", { ascending: true });

  const isOwner = staff.role === "owner";

  return (
    <StaffClient
      initialStaff={(staffMembers as any) || []}
      isOwner={isOwner}
      currentUserId={staff.user_id || ""}
    />
  );
}
