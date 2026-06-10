"use client";

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

interface MainLayoutProps {
  children: React.ReactNode;
  businessName: string;
  staffName: string;
}

export function MainLayout({ children, businessName, staffName }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-linear-to-br from-gray-50 via-blue-50/20 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen ml-3"
        style={{ width: isSidebarOpen ? 250 : 72 }}
      >
        <Sidebar
          businessName={businessName}
          staffName={staffName}
          isOpen={isSidebarOpen}
        />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <TopBar
          businessName={businessName}
          staffName={staffName}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
        />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
        <Footer />
        <OfflineIndicator />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 500,
            },
          }}
        />
      </div>
    </div>
  );
}

export default MainLayout;
