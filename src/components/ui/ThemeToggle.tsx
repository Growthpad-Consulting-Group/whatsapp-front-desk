"use client";

import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";

const themes = [
  { value: "light", icon: "solar:sun-2-broken", label: "Light" },
  { value: "system", icon: "solar:monitor-broken", label: "System" },
  { value: "dark", icon: "solar:moon-broken", label: "Dark" },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1 shadow-inner ${className ?? ""}`}>
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          title={t.label}
          className={`flex items-center justify-center transition-all rounded-lg w-9 h-9 ${
            theme === t.value
              ? "bg-white dark:bg-gray-700 text-primary shadow-md"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <Icon icon={t.icon} className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

export default ThemeToggle;
