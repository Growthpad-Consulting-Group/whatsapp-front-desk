import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Settings</h1>
      <p className="text-sm text-muted-foreground">Settings coming soon.</p>
    </div>
  );
}
