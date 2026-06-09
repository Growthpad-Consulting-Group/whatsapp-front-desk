import type { Metadata } from "next";
import Link from "next/link";
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your business profile, service offerings, team members, and operating hours.
        </p>
      </div>

      <div className="border-b border-border">
        <SettingsNav />
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
