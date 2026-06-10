export interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** If set, also matches child paths (e.g. /settings/* stays active on /settings) */
  matchPrefix?: boolean;
}

export const navItems: NavItem[] = [
  { href: "/dashboard",  label: "Dashboard",     icon: "solar:widget-broken" },
  { href: "/bookings",   label: "Bookings",  icon: "solar:calendar-date-broken",      matchPrefix: true },
  { href: "/invoices",   label: "Invoices",  icon: "solar:document-text-broken",      matchPrefix: true },
  { href: "/customers",  label: "Customers", icon: "solar:users-group-rounded-broken", matchPrefix: true },
  { href: "/messages",   label: "Messages",  icon: "solar:chat-square-broken",        matchPrefix: true },
  { href: "/settings",   label: "Settings",  icon: "solar:settings-broken",           matchPrefix: true },
];
