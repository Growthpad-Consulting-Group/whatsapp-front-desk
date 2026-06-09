"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

export interface Tab {
  key: string;
  label: string;
  icon?: string;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div
      className={`inline-flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-0.5 ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {isActive && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <span
              className={`relative z-10 flex items-center gap-1.5 transition-colors duration-150 ${
                isActive
                  ? "text-primary"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tab.icon && <Icon icon={tab.icon} className="w-4 h-4 shrink-0" />}
              {tab.label}
            </span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`relative z-10 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none transition-colors duration-150 ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                }`}
              >
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
