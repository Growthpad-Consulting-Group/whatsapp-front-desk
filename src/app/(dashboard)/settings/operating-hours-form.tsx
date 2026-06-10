"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { updateOperatingHoursAction } from "@/actions/business";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface OperatingHourRow {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

interface OperatingHoursFormProps {
  initialHours: OperatingHourRow[];
  isOwner: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function OperatingHoursForm({ initialHours, isOwner }: OperatingHoursFormProps) {
  const getFullHours = (): OperatingHourRow[] => {
    const hoursMap = new Map(initialHours.map((h) => [h.day_of_week, h]));
    return Array.from({ length: 7 }, (_, i) => {
      const existing = hoursMap.get(i);
      return existing ?? { day_of_week: i, open_time: "09:00", close_time: "17:00", is_closed: i === 0 };
    });
  };

  const [hours, setHours] = useState<OperatingHourRow[]>(getFullHours);
  const [loading, setLoading] = useState(false);

  const handleToggleClosed = (index: number) => {
    if (!isOwner) return;
    setHours((prev) =>
      prev.map((h, i) =>
        i === index
          ? {
              ...h,
              is_closed: !h.is_closed,
              open_time: h.is_closed ? h.open_time || "09:00" : h.open_time,
              close_time: h.is_closed ? h.close_time || "17:00" : h.close_time,
            }
          : h
      )
    );
  };

  const handleTimeChange = (index: number, field: "open_time" | "close_time", value: string) => {
    if (!isOwner) return;
    setHours((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setLoading(true);

    for (const h of hours) {
      if (!h.is_closed) {
        if (!h.open_time || !h.close_time) {
          toast.error(`Please set open and close times for ${DAYS[h.day_of_week]}.`);
          setLoading(false);
          return;
        }
        if (h.open_time >= h.close_time) {
          toast.error(`Open time must be before close time for ${DAYS[h.day_of_week]}.`);
          setLoading(false);
          return;
        }
      }
    }

    const res = await updateOperatingHoursAction(hours);
    setLoading(false);
    if (res.success) {
      toast.success("Operating hours saved successfully!");
    } else {
      toast.error(res.error || "Failed to save operating hours.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card/60 dark:bg-slate-900/60 backdrop-blur-md border border-border/80 rounded-2xl p-6 shadow-sm space-y-6 transition-all duration-300 hover:shadow-md">
        {/* Header */}
        <div className="flex items-start gap-3.5 pb-5 border-b border-border/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 shadow-sm shadow-blue-500/10 flex items-center justify-center shrink-0">
            <Icon icon="solar:clock-circle-broken" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-foreground leading-snug">Operating Hours</h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Clients can only book within these windows.
            </p>
          </div>
        </div>

        {/* Days */}
        <div className="space-y-2">
          {hours.map((hour, index) => (
            <div
              key={hour.day_of_week}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-300",
                hour.is_closed
                  ? "bg-muted/20 text-muted-foreground border-transparent opacity-60"
                  : "bg-white dark:bg-slate-950 border-border/60 shadow-2xs hover:shadow-sm hover:border-primary/30"
              )}
            >
              {/* Day label */}
              <div className="w-9 shrink-0 text-center">
                <span className={cn(
                  "text-[11px] font-black uppercase tracking-wider",
                  hour.is_closed ? "text-muted-foreground" : "text-primary"
                )}>
                  {DAY_SHORT[hour.day_of_week]}
                </span>
              </div>

              {/* Times or closed label */}
              <div className="flex-1 flex items-center gap-2 min-w-0 justify-center">
                {hour.is_closed ? (
                  <span className="text-xs font-semibold italic text-muted-foreground/80 py-1">Closed</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={hour.open_time || "09:00"}
                      onChange={(e) => handleTimeChange(index, "open_time", e.target.value)}
                      disabled={!isOwner}
                      className="h-8 rounded-lg border border-border/80 bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/40 focus:border-primary transition-all duration-300 disabled:opacity-50 w-26 font-medium"
                    />
                    <span className="text-xs text-muted-foreground font-black shrink-0">–</span>
                    <input
                      type="time"
                      value={hour.close_time || "17:00"}
                      onChange={(e) => handleTimeChange(index, "close_time", e.target.value)}
                      disabled={!isOwner}
                      className="h-8 rounded-lg border border-border/80 bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/40 focus:border-primary transition-all duration-300 disabled:opacity-50 w-26 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Toggle */}
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={!hour.is_closed}
                  onChange={() => handleToggleClosed(index)}
                  disabled={!isOwner}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary shadow-inner" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {isOwner && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" loading={loading} className="px-6 h-10 font-bold rounded-xl active:scale-95 transition-all duration-300">
            Save Hours
          </Button>
        </div>
      )}
    </form>
  );
}
