"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  description: string;
  exact?: boolean;
  ownerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/settings/profile",
    label: "My Profile",
    icon: "solar:user-circle-broken",
    description: "Name, phone & calendar",
  },
  {
    href: "/settings",
    label: "Business",
    icon: "solar:buildings-2-broken",
    description: "Profile, hours & region",
    exact: true,
    ownerOnly: true,
  },
  {
    href: "/settings/connection",
    label: "Connections",
    icon: "solar:plug-circle-broken",
    description: "WhatsApp & Paystack",
    ownerOnly: true,
  },
  {
    href: "/settings/services",
    label: "Services",
    icon: "solar:tag-price-broken",
    description: "Catalogue & pricing",
    ownerOnly: true,
  },
  {
    href: "/settings/staff",
    label: "Staff",
    icon: "solar:users-group-rounded-broken",
    description: "Team members & roles",
    ownerOnly: true,
  },
  {
    href: "/settings/templates",
    label: "Templates",
    icon: "solar:document-text-broken",
    description: "Message & reminder copy",
    ownerOnly: true,
  },
];

export function SettingsNav({ isOwner = false }: { isOwner?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings navigation" className="flex flex-col gap-0.5">
      {NAV_ITEMS.filter((item) => !item.ownerOnly || isOwner).map(({ href, label, icon, description, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150",
                active
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}
            >
              <Icon icon={icon} className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="flex flex-col min-w-0">
              <span className={cn("font-semibold leading-snug truncate", active ? "text-primary" : "text-foreground")}>
                {label}
              </span>
              <span className="text-xs text-muted-foreground leading-snug truncate">{description}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
