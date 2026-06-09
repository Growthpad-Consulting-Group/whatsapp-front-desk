"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { updateOperatingHoursAction } from "@/actions/business";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

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
    setStatus(null);

    for (const h of hours) {
      if (!h.is_closed) {
        if (!h.open_time || !h.close_time) {
          setStatus({ success: false, message: `Set open and close times for ${DAYS[h.day_of_week]}.` });
          setLoading(false);
          return;
        }
        if (h.open_time >= h.close_time) {
          setStatus({ success: false, message: `Open time must be before close time for ${DAYS[h.day_of_week]}.` });
          setLoading(false);
          return;
        }
      }
    }

    const res = await updateOperatingHoursAction(hours);
    setLoading(false);
    setStatus(res.success
      ? { success: true, message: "Operating hours saved!" }
      : { success: false, message: res.error }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3 pb-4 border-b border-border/60">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Icon icon="solar:clock-circle-broken" className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Operating Hours</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Clients can only book within these windows.
            </p>
          </div>
        </div>

        {/* Days */}
        <div className="space-y-1">
          {hours.map((hour, index) => (
            <div
              key={hour.day_of_week}
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-colors",
                hour.is_closed
                  ? "bg-muted/40 text-muted-foreground"
                  : "bg-primary/5 hover:bg-primary/8"
              )}
            >
              {/* Day label */}
              <div className="w-8 shrink-0 text-center">
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-wider",
                  hour.is_closed ? "text-muted-foreground" : "text-primary"
                )}>
                  {DAY_SHORT[hour.day_of_week]}
                </span>
              </div>

              {/* Times or closed label */}
              <div className="flex-1 flex items-center gap-2 min-w-0">
                {hour.is_closed ? (
                  <span className="text-xs italic text-muted-foreground">Closed</span>
                ) : (
                  <>
                    <input
                      type="time"
                      value={hour.open_time || "09:00"}
                      onChange={(e) => handleTimeChange(index, "open_time", e.target.value)}
                      disabled={!isOwner}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 w-26"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">–</span>
                    <input
                      type="time"
                      value={hour.close_time || "17:00"}
                      onChange={(e) => handleTimeChange(index, "close_time", e.target.value)}
                      disabled={!isOwner}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 w-26"
                    />
                  </>
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
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {isOwner && (
        <div className="flex items-center justify-end gap-3">
          {status && (
            <div className={cn(
              "flex items-center gap-2 text-sm",
              status.success ? "text-green-600 dark:text-green-400" : "text-destructive"
            )}>
              <Icon
                icon={status.success ? "solar:check-circle-broken" : "solar:close-circle-broken"}
                className="w-4 h-4 shrink-0"
              />
              {status.message}
            </div>
          )}
          <Button type="submit" loading={loading}>
            Save Hours
          </Button>
        </div>
      )}
    </form>
  );
}
