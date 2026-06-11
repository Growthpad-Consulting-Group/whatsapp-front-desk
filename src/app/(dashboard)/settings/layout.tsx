import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import { SettingsNav } from "./settings-nav";
import { requireBusiness } from "@/lib/data/business";

export const metadata: Metadata = {
  title: "Settings — WhatsApp Front Desk",
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { staff } = await requireBusiness();
  const isOwner = staff.role === "owner";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        icon="solar:settings-bold-duotone"
        iconBgColor="bg-linear-to-br from-blue-600 to-blue-500"
        description="Manage your business profile, services, team, and operating hours."
      />

      <div className="flex gap-8 items-start">
        <aside className="hidden lg:flex flex-col w-52 shrink-0">
          <SettingsNav isOwner={isOwner} />
        </aside>

        <div className="lg:hidden w-full overflow-x-auto pb-2">
          <SettingsNav isOwner={isOwner} />
        </div>

        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
