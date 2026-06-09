import type { Metadata } from "next";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopBar } from "@/components/layout/top-bar";
import { requireBusiness } from "@/lib/data/business";

export const metadata: Metadata = {
  title: {
    template: "%s — WhatsApp Front Desk",
    default: "Dashboard — WhatsApp Front Desk",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business, staff } = await requireBusiness();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-card px-4 py-6 shrink-0">
        <div className="mb-8 px-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Front Desk
          </p>
          <p className="text-sm font-semibold text-foreground truncate">
            {business.name}
          </p>
        </div>
        <SidebarNav />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar businessName={business.name} staffName={staff.name} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
