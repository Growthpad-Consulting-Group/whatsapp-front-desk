import type { Metadata } from "next";
import { MainLayout } from "@/layouts/MainLayout";
import { requireBusiness } from "@/lib/data/business";

export const metadata: Metadata = {
  title: {
    template: "%s — WhatsApp Front Desk",
    default: "Dashboard — WhatsApp Front Desk",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business, staff } = await requireBusiness();

  return (
    <MainLayout businessName={business.name} staffName={staff.name}>
      {children}
    </MainLayout>
  );
}
