"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

const features = [
  {
    icon: "solar:calendar-date-bold-duotone",
    title: "Automated Booking",
    description: "Clients book appointments via WhatsApp, 24/7 — no manual back-and-forth",
    color: "#4ade80",
  },
  {
    icon: "solar:chat-round-dots-bold-duotone",
    title: "Instant Bot Replies",
    description: "AI bot handles FAQs, confirmations, and reminders automatically",
    color: "#60a5fa",
  },
  {
    icon: "solar:document-text-bold-duotone",
    title: "Invoice & Payments",
    description: "Generate invoices, collect deposits, and track balances in one place",
    color: "#f97316",
  },
  {
    icon: "solar:users-group-rounded-bold-duotone",
    title: "Customer Profiles",
    description: "Full history, consent records, and outstanding balances per client",
    color: "#a78bfa",
  },
  {
    icon: "solar:widget-bold-duotone",
    title: "Service Catalog",
    description: "Define services, durations, prices, and deposit rules for booking",
    color: "#fb7185",
  },
  {
    icon: "solar:chart-square-bold-duotone",
    title: "Live Dashboard",
    description: "Today's bookings, unpaid invoices, and key metrics at a glance",
    color: "#facc15",
  },
];

export function LoginRightPanel() {
  return (
    <div className="hidden md:flex relative z-10 flex-1 flex-col items-center justify-center p-12 overflow-hidden">
      <div className="w-full max-w-xl space-y-8">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-700 font-medium text-sm mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Your front desk, always on
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Run your business<br />
            <span className="text-primary">through WhatsApp</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base font-medium max-w-md mx-auto">
            Everything you need to automate bookings, track payments, and keep clients happy.
          </p>
        </motion.div>

        {/* Feature Cards — 2×3 grid */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
            >
              <SpotlightCard className="p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-white/60 dark:bg-white/5 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-white/10 transition-all group h-full">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <Icon icon={feature.icon} className="w-4.5 h-4.5" style={{ color: feature.color }} />
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
