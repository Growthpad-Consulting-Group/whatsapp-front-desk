"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth";

// ── Shared hook: close on outside click ─────────────────────────────────────

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [active, ref, onClose]);
}

// ── Dropdown panel shell ─────────────────────────────────────────────────────

function DropdownPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.15 }}
      className={[
        "absolute right-0 top-full mt-2 rounded-2xl shadow-2xl border z-50",
        isDark
          ? "bg-gray-900 border-white/10 text-gray-100 shadow-black/60"
          : "bg-white border-gray-100 text-gray-900 shadow-gray-200/60",
        className,
      ].join(" ")}
    >
      {children}
    </motion.div>
  );
}

// ── Header icon button ───────────────────────────────────────────────────────

function HeaderIconButton({
  onClick,
  title,
  children,
  badge,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  badge?: number;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={title}
      className={[
        "relative flex items-center justify-center rounded-xl p-2 min-h-10 min-w-10 transition-all duration-300",
        isDark
          ? "bg-gray-800 text-gray-100 hover:bg-gray-700"
          : "bg-gray-100/80 text-gray-700 hover:bg-gray-200",
      ].join(" ")}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold leading-none shadow">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </motion.button>
  );
}

// ── Search ───────────────────────────────────────────────────────────────────

const SEARCH_ROUTES = [
  { label: "Bookings", href: "/bookings", icon: "solar:calendar-date-broken", group: "Pages" },
  { label: "Invoices", href: "/invoices", icon: "solar:document-text-broken", group: "Pages" },
  { label: "Customers", href: "/customers", icon: "solar:users-group-rounded-broken", group: "Pages" },
  { label: "Messages", href: "/messages", icon: "solar:chat-square-broken", group: "Pages" },
  { label: "Dashboard", href: "/dashboard", icon: "solar:widget-broken", group: "Pages" },
  { label: "Settings — Staff", href: "/settings/staff", icon: "solar:users-group-two-rounded-broken", group: "Settings" },
  { label: "Settings — Services", href: "/settings/services", icon: "solar:box-broken", group: "Settings" },
];

function SearchModal({ onClose }: { onClose: () => void }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const results = query.trim()
    ? SEARCH_ROUTES.filter((r) =>
        r.label.toLowerCase().includes(query.toLowerCase())
      )
    : SEARCH_ROUTES;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const go = (href: string) => {
    router.push(href);
    onClose();
  };

  const groups = Array.from(new Set(results.map((r) => r.group)));

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ duration: 0.18 }}
        className={[
          "relative w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden",
          isDark
            ? "bg-gray-900 border-white/10"
            : "bg-white border-gray-200",
        ].join(" ")}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/10">
          <Icon icon="solar:magnifer-broken" className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookings, customers, invoices…"
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 dark:placeholder-gray-500"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-muted-foreground">No results for &quot;{query}&quot;</p>
          ) : (
            groups.map((group) => (
              <div key={group}>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {group}
                </p>
                {results
                  .filter((r) => r.group === group)
                  .map((r) => (
                    <button
                      key={r.href}
                      onClick={() => go(r.href)}
                      className={[
                        "flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors text-left",
                        isDark
                          ? "hover:bg-white/5 text-gray-300 hover:text-white"
                          : "hover:bg-gray-50 text-gray-700 hover:text-gray-900",
                      ].join(" ")}
                    >
                      <Icon icon={r.icon} className="w-4 h-4 shrink-0 text-primary" />
                      {r.label}
                    </button>
                  ))}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-white/10 flex items-center gap-4 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold">ESC</kbd>
            close
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// ── Notifications ────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    icon: "solar:calendar-date-broken",
    iconColor: "text-blue-500",
    title: "New booking",
    body: "Sarah K. booked a haircut for tomorrow at 10am",
    time: "2m ago",
    read: false,
  },
  {
    id: "2",
    icon: "solar:chat-square-broken",
    iconColor: "text-green-500",
    title: "New WhatsApp message",
    body: "Hi, can I reschedule my appointment?",
    time: "15m ago",
    read: false,
  },
  {
    id: "3",
    icon: "solar:document-text-broken",
    iconColor: "text-purple-500",
    title: "Invoice paid",
    body: "Invoice #INV-042 was paid — R450.00",
    time: "1h ago",
    read: true,
  },
];

function NotificationsDropdown() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useClickOutside(ref, () => setOpen(false), open);

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <div className="relative shrink-0" ref={ref}>
      <HeaderIconButton onClick={() => setOpen((v) => !v)} title="Notifications" badge={unread}>
        <Icon icon="solar:bell-broken" className="w-5 h-5" />
      </HeaderIconButton>

      <AnimatePresence>
        {open && (
          <DropdownPanel className="w-80">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-sm text-center text-muted-foreground">
                  No notifications
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                      )
                    }
                    className={[
                      "flex items-start gap-3 w-full px-4 py-3 text-left transition-colors",
                      n.read
                        ? isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                        : isDark ? "bg-primary/5 hover:bg-primary/10" : "bg-primary/5 hover:bg-primary/10",
                    ].join(" ")}
                  >
                    <div className={`mt-0.5 shrink-0 ${n.iconColor}`}>
                      <Icon icon={n.icon} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold truncate ${n.read ? "text-muted-foreground" : ""}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    </div>
                    {!n.read && (
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/10">
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-primary hover:underline w-full text-center"
              >
                View all activity
              </button>
            </div>
          </DropdownPanel>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Theme dropdown ───────────────────────────────────────────────────────────

const THEMES = [
  { value: "light", icon: "solar:sun-2-broken", label: "Light" },
  { value: "system", icon: "solar:monitor-broken", label: "System" },
  { value: "dark", icon: "solar:moon-broken", label: "Dark" },
] as const;

function ThemeDropdown() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentIcon =
    theme === "light" ? "solar:sun-2-broken" :
    theme === "dark"  ? "solar:moon-broken"  :
                        "solar:monitor-broken";

  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div className="relative shrink-0" ref={ref}>
      <HeaderIconButton onClick={() => setOpen((v) => !v)} title={`Theme: ${theme}`}>
        <Icon
          icon={currentIcon}
          className={`w-5 h-5 transition-transform duration-500 ${open ? "rotate-12 scale-110" : ""}`}
        />
      </HeaderIconButton>

      <AnimatePresence>
        {open && (
          <DropdownPanel className="p-2">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setTheme(t.value); setTimeout(() => setOpen(false), 200); }}
                  title={t.label}
                  className={[
                    "flex items-center justify-center rounded-lg w-10 h-10 transition-all",
                    theme === t.value
                      ? "bg-white dark:bg-gray-700 text-primary shadow-md"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                  ].join(" ")}
                >
                  <Icon icon={t.icon} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </DropdownPanel>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Profile dropdown ─────────────────────────────────────────────────────────

interface ProfileDropdownProps {
  staffName: string;
}

function ProfileDropdown({ staffName }: ProfileDropdownProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = staffName?.[0]?.toUpperCase() ?? "U";
  const close = useCallback(() => setOpen(false), []);

  useClickOutside(ref, close, open);

  return (
    <div className="relative shrink-0" ref={ref}>
      <HeaderIconButton onClick={() => setOpen((v) => !v)} title="Account">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{initial}</span>
        </div>
      </HeaderIconButton>

      <AnimatePresence>
        {open && (
          <DropdownPanel className="w-72">
            <div className="p-4">
              {/* User header */}
              <div className="flex items-center gap-3 px-2 pb-3 border-b border-gray-100 dark:border-white/10">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-base font-bold text-primary">{initial}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{staffName}</span>
                  <span className="text-xs text-muted-foreground">Staff</span>
                </div>
              </div>

              {/* Menu */}
              <ul className="py-2 space-y-0.5">
                {[
                  { icon: "solar:settings-broken", label: "Settings", href: "/settings" },
                  { icon: "solar:question-circle-broken", label: "Help & Support", href: "/help" },
                ].map(({ icon, label, href }) => (
                  <li key={href}>
                    <a
                      href={href}
                      onClick={close}
                      className={[
                        "flex items-center gap-2 text-sm p-2 rounded-lg transition-all min-h-11",
                        isDark
                          ? "text-gray-300 hover:text-white hover:bg-gray-800"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <Icon icon={icon} className="h-5 w-5" />
                      <span>{label}</span>
                    </a>
                  </li>
                ))}
              </ul>

              {/* Sign out */}
              <form action={logoutAction}>
                <button
                  type="submit"
                  onClick={close}
                  className="flex items-center gap-2 w-full text-sm p-2 rounded-lg border-t border-gray-100 dark:border-white/10 mt-1 pt-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                >
                  <Icon icon="solar:logout-broken" className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          </DropdownPanel>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── TopBar ───────────────────────────────────────────────────────────────────

interface TopBarProps {
  businessName: string;
  staffName: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function TopBar({ businessName, staffName, isSidebarOpen, onToggleSidebar }: TopBarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-20 px-4 pt-3 pb-1"
      >
        <div
          className={[
            "flex items-center justify-between rounded-2xl px-3 py-2",
            "border backdrop-saturate-180",
            isDark
              ? "bg-gray-900/20 backdrop-blur-2xl text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] border-white/10"
              : "bg-white/20 backdrop-blur-2xl text-gray-900 shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] border-white/40",
          ].join(" ")}
        >
          {/* Left: toggle + search */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={onToggleSidebar}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden lg:flex p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Icon
                icon={isSidebarOpen ? "solar:double-alt-arrow-left-broken" : "solar:double-alt-arrow-right-broken"}
                className="w-5 h-5"
              />
            </motion.button>

            {/* Mobile title */}
            <p className="lg:hidden text-sm font-semibold truncate">{businessName}</p>

            {/* Search */}
            <motion.button
              onClick={() => setSearchOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={[
                "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all border",
                isDark
                  ? "bg-gray-800/80 text-gray-400 hover:text-gray-200 border-white/5 hover:bg-gray-700/80"
                  : "bg-gray-100/80 text-gray-400 hover:text-gray-600 border-black/5 hover:bg-gray-200/80",
              ].join(" ")}
              title="Search (⌘K)"
            >
              <Icon icon="solar:magnifer-broken" className="w-4 h-4 shrink-0" />
              <span className="hidden md:block">Search…</span>
              <div className={[
                "hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border",
                isDark
                  ? "bg-white/10 text-gray-500 border-gray-700"
                  : "bg-black/5 text-gray-400 border-gray-200",
              ].join(" ")}>
                <span className="text-[11px] opacity-70">⌘</span>
                <span>K</span>
              </div>
            </motion.button>
          </div>

          {/* Right: notifications + theme + profile */}
          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            <ThemeDropdown />
            <ProfileDropdown staffName={staffName} />
          </div>
        </div>
      </motion.header>

      {/* Search modal */}
      <AnimatePresence>
        {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

export default TopBar;
