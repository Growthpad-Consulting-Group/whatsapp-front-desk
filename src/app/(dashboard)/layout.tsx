import type { Metadata } from "next";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export const metadata: Metadata = {
  title: {
    template: "%s — WhatsApp Front Desk",
    default: "Dashboard — WhatsApp Front Desk",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-card px-4 py-6 shrink-0">
        <div className="mb-8 px-3">
          <span className="text-base font-semibold text-primary">
            WA Front Desk
          </span>
        </div>
        <SidebarNav />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center px-6 shrink-0">
          {/* Mobile menu trigger + breadcrumb will go here */}
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
