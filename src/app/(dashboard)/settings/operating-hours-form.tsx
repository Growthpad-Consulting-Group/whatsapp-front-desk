"use client";

import { useState } from "react";
import { updateOperatingHoursAction } from "@/actions/business";
import { Button } from "@/components/ui/button";

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

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function OperatingHoursForm({ initialHours, isOwner }: OperatingHoursFormProps) {
  // Ensure we have a row for every day of the week
  const getFullHours = (): OperatingHourRow[] => {
    const hoursMap = new Map(initialHours.map((h) => [h.day_of_week, h]));
    return Array.from({ length: 7 }, (_, i) => {
      const existing = hoursMap.get(i);
      return (
        existing ?? {
          day_of_week: i,
          open_time: "09:00",
          close_time: "17:00",
          is_closed: i === 0, // closed on Sunday by default
        }
      );
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
              // fill defaults if toggled open and times are empty
              open_time: h.is_closed ? h.open_time || "09:00" : h.open_time,
              close_time: h.is_closed ? h.close_time || "17:00" : h.close_time,
            }
          : h
      )
    );
  };

  const handleTimeChange = (
    index: number,
    field: "open_time" | "close_time",
    value: string
  ) => {
    if (!isOwner) return;
    setHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setLoading(true);
    setStatus(null);

    // Validate times are set if open
    for (const h of hours) {
      if (!h.is_closed) {
        if (!h.open_time || !h.close_time) {
          setStatus({
            success: false,
            message: `Please specify open and close times for ${DAYS[h.day_of_week]}.`,
          });
          setLoading(false);
          return;
        }
        if (h.open_time >= h.close_time) {
          setStatus({
            success: false,
            message: `Open time must be before close time for ${DAYS[h.day_of_week]}.`,
          });
          setLoading(false);
          return;
        }
      }
    }

    const res = await updateOperatingHoursAction(hours);
    setLoading(false);

    if (res.success) {
      setStatus({ success: true, message: "Operating hours saved successfully!" });
    } else {
      setStatus({ success: false, message: res.error });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Operating Hours</h2>
          <p className="text-sm text-muted-foreground">
            Set your weekly working hours. Clients will only be able to book slots within these windows.
          </p>
        </div>

        <div className="space-y-4">
          {hours.map((hour, index) => {
            const dayName = DAYS[hour.day_of_week];

            return (
              <div
                key={hour.day_of_week}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-4 w-40">
                  <span className="text-sm font-medium text-foreground">{dayName}</span>
                </div>

                <div className="flex items-center gap-6 flex-1 justify-end">
                  {!hour.is_closed ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={hour.open_time || "09:00"}
                        onChange={(e) =>
                          handleTimeChange(index, "open_time", e.target.value)
                        }
                        disabled={!isOwner}
                        className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={hour.close_time || "17:00"}
                        onChange={(e) =>
                          handleTimeChange(index, "close_time", e.target.value)
                        }
                        disabled={!isOwner}
                        className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic mr-4">Closed for bookings</span>
                  )}

                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!hour.is_closed}
                      onChange={() => handleToggleClosed(index)}
                      disabled={!isOwner}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    <span className="ml-3 text-sm font-medium text-foreground min-w-[50px]">
                      {hour.is_closed ? "Closed" : "Open"}
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isOwner && (
        <div className="flex justify-end gap-3">
          {status && (
            <p
              className={`text-sm self-center ${
                status.success ? "text-green-600 dark:text-green-400" : "text-destructive"
              }`}
            >
              {status.message}
            </p>
          )}
          <Button type="submit" loading={loading}>
            Save Operating Hours
          </Button>
        </div>
      )}
    </form>
  );
}
