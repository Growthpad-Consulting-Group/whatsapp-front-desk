"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";

const TABS = [
  { key: "/settings",           label: "General & Hours",  icon: "solar:settings-broken" },
  { key: "/settings/services",  label: "Services",          icon: "solar:tag-price-broken" },
  { key: "/settings/staff",     label: "Staff",             icon: "solar:users-group-rounded-broken" },
  { key: "/settings/templates", label: "Templates",         icon: "solar:document-text-broken" },
];

export function SettingsNav() {
  const pathname = usePathname();
  const router = useRouter();

  const active = TABS.find((t) => t.key === pathname)?.key ?? "/settings";

  return (
    <Tabs
      tabs={TABS}
      activeTab={active}
      onChange={(key) => router.push(key)}
      className="w-full sm:w-auto"
    />
  );
}
