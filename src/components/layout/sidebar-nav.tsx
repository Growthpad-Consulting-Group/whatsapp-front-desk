"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";

const navItems = [
  { href: "/dashboard", label: "Today", icon: "solar:widget-broken" },
  { href: "/bookings", label: "Bookings", icon: "solar:calendar-date-broken" },
  { href: "/invoices", label: "Invoices", icon: "solar:document-text-broken" },
  { href: "/customers", label: "Customers", icon: "solar:users-group-rounded-broken" },
  { href: "/messages", label: "Messages", icon: "solar:chat-square-broken" },
  { href: "/settings", label: "Settings", icon: "solar:settings-broken" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4">
      {/* Branding */}
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Icon icon="solar:chat-round-dots-bold-duotone" className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        <span className="font-bold text-sm text-foreground leading-tight">WhatsApp<br />Front Desk</span>
      </div>

      <nav aria-label="Main navigation">
      <ul className="space-y-1">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon icon={icon} className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </div>
  );
}
