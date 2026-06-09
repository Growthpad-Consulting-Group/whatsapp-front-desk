import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import { SettingsNav } from "./settings-nav";

export const metadata: Metadata = {
  title: "Settings — WhatsApp Front Desk",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        icon="solar:settings-bold-duotone"
        iconBgColor="bg-linear-to-br from-blue-600 to-blue-500"
        description="Manage your business profile, services, team, and operating hours."
      />

      <SettingsNav />

      <div>{children}</div>
    </div>
  );
}
