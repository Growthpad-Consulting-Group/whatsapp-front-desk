"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";

export function SettingsNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/settings", label: "General & Hours", icon: "mdi:office-building" },
    { href: "/settings/services", label: "Services", icon: "mdi:tune" },
    { href: "/settings/staff", label: "Staff", icon: "mdi:account-group" },
    { href: "/settings/templates", label: "Templates", icon: "mdi:file-document-edit" },
  ];

  return (
    <nav className="flex space-x-2" aria-label="Settings navigation">
      {tabs.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-all duration-200",
              active
                ? "border-primary text-primary bg-primary/5 rounded-t-lg"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/35"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon icon={tab.icon} className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
