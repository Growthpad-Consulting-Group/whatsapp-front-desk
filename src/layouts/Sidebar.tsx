"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { logoutAction } from "@/actions/auth";
import { useState, useEffect, useRef } from "react";

const navItems = [
  { href: "/dashboard", label: "Today", icon: "solar:widget-broken" },
  { href: "/bookings", label: "Bookings", icon: "solar:calendar-date-broken" },
  { href: "/invoices", label: "Invoices", icon: "solar:document-text-broken" },
  { href: "/customers", label: "Customers", icon: "solar:users-group-rounded-broken" },
  { href: "/messages", label: "Messages", icon: "solar:chat-square-broken" },
  { href: "/settings", label: "Settings", icon: "solar:settings-broken" },
];

interface SidebarProps {
  businessName?: string;
  isOpen: boolean;
}

export function Sidebar({ businessName, isOpen }: SidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  return (
    <div
      className={cn(
        "flex flex-col h-full my-4 rounded-3xl transition-all duration-300",
        "border border-white/20 dark:border-white/5",
        isDark
          ? "bg-gray-900/80 backdrop-blur-2xl text-gray-100 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
          : "bg-white/70 backdrop-blur-2xl text-gray-800 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]"
      )}
      style={{ width: isOpen ? 250 : 72 }}
    >
      {/* Logo header */}
      <div
        className={cn(
          "h-18 shrink-0 flex items-center py-4 px-3 border-b border-white/10 dark:border-white/5",
          !isOpen ? "justify-center" : "justify-start"
        )}
      >
        <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
          {isOpen ? (
            <Image
              src={isDark ? "/assets/images/logo-white.svg" : "/logo.svg"}
              alt="WhatsApp Front Desk"
              width={160}
              height={48}
              className="w-36 h-auto"
              priority
            />
          ) : (
            <Image
              src={isDark ? "/assets/images/logo-white.svg" : "/logo.svg"}
              alt="WhatsApp Front Desk"
              width={40}
              height={40}
              className="w-9 h-9 object-contain"
              priority
            />
          )}
        </Link>
      </div>

      {/* Business name (expanded only) */}
      {isOpen && businessName && (
        <p className="text-xs text-muted-foreground truncate px-4 pt-3 pb-1">{businessName}</p>
      )}

      {/* Nav */}
      <nav aria-label="Main navigation" className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden space-y-1">
        {navItems.map(({ href, label, icon }, index) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                  !isOpen && "justify-center",
                  active
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : isDark
                      ? "text-gray-400 hover:bg-white/5 hover:text-white"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                )}
                aria-current={active ? "page" : undefined}
                title={!isOpen ? label : undefined}
              >
                <Icon icon={icon} className="h-5 w-5 shrink-0" aria-hidden="true" />
                {isOpen && <span className="truncate">{label}</span>}
                {/* Collapsed active indicator */}
                {active && !isOpen && (
                  <motion.div
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User menu at bottom */}
      <div
        ref={userMenuRef}
        className="px-3 py-4 mt-auto border-t border-white/10 dark:border-white/5"
      >
        <button
          onClick={() => setShowUserMenu((v) => !v)}
          className={cn(
            "flex items-center gap-3 w-full rounded-xl p-2.5 transition-all duration-300",
            !isOpen && "justify-center",
            isDark ? "hover:bg-white/5 text-gray-300 hover:text-white" : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Icon icon="solar:user-circle-broken" className="h-5 w-5 text-primary" />
          </div>
          {isOpen && (
            <div className="flex items-center justify-between w-full min-w-0">
              <span className="text-sm font-semibold truncate">Account</span>
              <Icon
                icon="solar:alt-arrow-right-broken"
                className={cn("w-4 h-4 text-gray-400 transition-transform duration-300", showUserMenu && "rotate-90")}
              />
            </div>
          )}
        </button>

        {/* Expanded menu */}
        <div
          className={cn(
            "transition-all duration-300 overflow-hidden",
            showUserMenu && isOpen ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0"
          )}
        >
          <div className="flex flex-col gap-1 p-1">
            <div className="my-1 h-px bg-white/10 dark:bg-white/5" />
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-3 w-full p-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all duration-200"
              >
                <Icon icon="solar:logout-broken" className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
