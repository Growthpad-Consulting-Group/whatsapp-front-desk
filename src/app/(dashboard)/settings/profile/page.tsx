import { requireBusiness } from "@/lib/data/business";
import { MyProfileForm } from "./my-profile-form";

export const metadata = {
  title: "My Profile — Settings",
};

export default async function MyProfilePage() {
  const { staff } = await requireBusiness();
  return <MyProfileForm staff={staff} />;
}
