"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show "restored" feedback briefly, then slide away
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    // Initial check
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 350 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-80 shadow-2xl rounded-2xl overflow-hidden"
        >
          {isOnline ? (
            <div className="bg-emerald-600 dark:bg-emerald-500 text-white p-4 flex items-center gap-3 border border-emerald-500/20 shadow-lg">
              <div className="h-8.5 w-8.5 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Icon icon="solar:check-circle-bold-duotone" className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black">Connection Restored</p>
                <p className="text-[10px] opacity-90 mt-0.5 font-medium">Real-time sync resumed successfully.</p>
              </div>
            </div>
          ) : (
            <div className="bg-rose-600 dark:bg-rose-500 text-white p-4 flex items-center gap-3 border border-rose-500/20 shadow-lg">
              <div className="h-8.5 w-8.5 rounded-xl bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
                <Icon icon="solar:bill-cross-bold-duotone" className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black">Connection Lost</p>
                <p className="text-[10px] opacity-90 mt-0.5 font-medium">Real-time message feeds are paused.</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
