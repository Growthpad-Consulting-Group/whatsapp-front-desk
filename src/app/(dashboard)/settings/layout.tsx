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

      <div className="flex gap-8 items-start">
        {/* Left — vertical settings nav */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0">
          <SettingsNav />
        </aside>

        {/* Mobile — horizontal scrollable nav */}
        <div className="lg:hidden w-full overflow-x-auto pb-2">
          <SettingsNav />
        </div>

        {/* Right — page content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
