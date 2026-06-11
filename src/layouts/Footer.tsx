"use client";

import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto mx-4 mb-3 py-3 px-6 rounded-xl border backdrop-blur-sm transition-all duration-300 bg-white/80 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-sm">
          <span className="opacity-60">© {year}</span>{" "}
          <span className="font-medium text-foreground/70">WhatsApp Front Desk.</span>{" "}
          <span className="opacity-60 text-xs">All rights reserved</span>
        </p>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link href="/help" className="hover:text-primary transition-colors">
            Support
          </Link>
          <span className="opacity-50 cursor-default">v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
