"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import StatusPill from "@/components/ui/StatusPill";

interface CalendarAppointment {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  customers?: { name?: string } | null;
  services?: { name?: string } | null;
  staff_members?: { name?: string } | null;
}

interface WeekCalendarProps {
  appointments: CalendarAppointment[];
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  timezone: string;
  onAppointmentClick?: (appt: CalendarAppointment) => void;
}

const HOUR_START = 7;   // 7 AM
const HOUR_END = 21;    // 9 PM
const SLOT_MINS = 30;
const TOTAL_SLOTS = ((HOUR_END - HOUR_START) * 60) / SLOT_MINS;
const SLOT_HEIGHT = 28; // px per 30-min slot

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-primary/15 border-primary/40 text-primary",
  pending: "bg-amber-500/15 border-amber-400/40 text-amber-700 dark:text-amber-400",
  completed: "bg-slate-400/15 border-slate-400/40 text-slate-600 dark:text-slate-400",
  cancelled: "bg-red-500/10 border-red-400/30 text-red-500 line-through opacity-60",
  no_show: "bg-orange-500/10 border-orange-400/30 text-orange-600 opacity-70",
};

function toLocalHHMM(dateStr: string, timezone: string) {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

function localDayKey(dateStr: string, timezone: string) {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function slotIndex(dateStr: string, timezone: string): number {
  const hhmm = toLocalHHMM(dateStr, timezone);
  const [h, m] = hhmm.split(":").map(Number);
  return ((h - HOUR_START) * 60 + m) / SLOT_MINS;
}

function durationSlots(startStr: string, endStr: string, timezone: string): number {
  const startMin = slotIndex(startStr, timezone) * SLOT_MINS;
  const endHHMM = toLocalHHMM(endStr, timezone);
  const [eh, em] = endHHMM.split(":").map(Number);
  const endMin = (eh - HOUR_START) * 60 + em;
  return Math.max(1, Math.round((endMin - startMin) / SLOT_MINS));
}

export function WeekCalendar({ appointments, weekStart, onPrevWeek, onNextWeek, timezone, onAppointmentClick }: WeekCalendarProps) {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const dayKeys = useMemo(() => days.map((d) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
  ), [days, timezone]);

  const apptsByDay = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    dayKeys.forEach((k) => map.set(k, []));
    appointments.forEach((appt) => {
      const key = localDayKey(appt.start_at, timezone);
      if (map.has(key)) map.get(key)!.push(appt);
    });
    return map;
  }, [appointments, dayKeys, timezone]);

  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  const weekLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(days[0]) +
    " – " + new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(days[6]);

  const hourLabels = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => {
    const h = HOUR_START + i;
    return h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
  });

  return (
    <div className="bg-card/65 backdrop-blur-md border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
        <button type="button" onClick={onPrevWeek} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <Icon icon="solar:arrow-left-broken" className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">{weekLabel}</span>
        <button type="button" onClick={onNextWeek} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <Icon icon="solar:arrow-right-broken" className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-border/50 bg-muted/20">
            <div />
            {days.map((d, i) => {
              const isToday = dayKeys[i] === todayKey;
              return (
                <div key={i} className={cn("py-2 text-center border-l border-border/30", isToday && "bg-primary/5")}>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(d)}
                  </p>
                  <p className={cn("text-sm font-bold mt-0.5", isToday ? "text-primary" : "text-foreground")}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          <div className="relative" style={{ height: TOTAL_SLOTS * SLOT_HEIGHT }}>
            {/* Hour lines + labels */}
            {hourLabels.map((label, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 flex items-start pointer-events-none"
                style={{ top: i * 2 * SLOT_HEIGHT }}
              >
                <span className="w-12 text-[9px] text-muted-foreground/60 text-right pr-2 leading-none -translate-y-1.5 shrink-0">
                  {label}
                </span>
                <div className="flex-1 border-t border-border/25" />
              </div>
            ))}

            {/* Half-hour lines */}
            {Array.from({ length: TOTAL_SLOTS }, (_, i) => i % 2 === 1 && (
              <div
                key={`h-${i}`}
                className="absolute left-12 right-0 border-t border-border/10 pointer-events-none"
                style={{ top: i * SLOT_HEIGHT }}
              />
            ))}

            {/* Day columns */}
            <div className="absolute inset-0 left-12 grid grid-cols-7">
              {days.map((_, di) => {
                const isToday = dayKeys[di] === todayKey;
                const dayAppts = apptsByDay.get(dayKeys[di]) ?? [];
                return (
                  <div key={di} className={cn("relative border-l border-border/30 h-full", isToday && "bg-primary/[0.03]")}>
                    {dayAppts.map((appt) => {
                      const top = slotIndex(appt.start_at, timezone);
                      const slots = durationSlots(appt.start_at, appt.end_at, timezone);
                      if (top < 0 || top >= TOTAL_SLOTS) return null;
                      const clampedSlots = Math.min(slots, TOTAL_SLOTS - top);
                      const colorClass = STATUS_COLORS[appt.status] ?? STATUS_COLORS.confirmed;
                      return (
                        <button
                          key={appt.id}
                          type="button"
                          onClick={() => onAppointmentClick?.(appt)}
                          className={cn(
                            "absolute left-0.5 right-0.5 rounded-md border px-1 py-0.5 text-left overflow-hidden transition-all hover:brightness-95 hover:shadow-sm cursor-pointer",
                            colorClass
                          )}
                          style={{
                            top: top * SLOT_HEIGHT + 1,
                            height: clampedSlots * SLOT_HEIGHT - 2,
                          }}
                          title={`${appt.customers?.name ?? "Client"} — ${appt.services?.name ?? "Service"}`}
                        >
                          <p className="text-[10px] font-bold leading-tight truncate">
                            {appt.customers?.name ?? "Client"}
                          </p>
                          {clampedSlots >= 2 && (
                            <p className="text-[9px] leading-tight truncate opacity-80">
                              {appt.services?.name ?? ""}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
