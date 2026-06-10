'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

// ─── Config ───────────────────────────────────────────────────────────────────

// 7AM → 9PM in 1-hour slots (15 slots)
const HOUR_START = 7;
const HOUR_END   = 21;
const HOURS      = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const DAYS       = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// JS getDay(): 0=Sun,1=Mon...6=Sat → map to Mon=0...Sun=6
function dayIndex(jsDay: number) { return jsDay === 0 ? 6 : jsDay - 1; }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeatmapAppointment {
  start_at: string;
  status?: string;
}

export interface BookingHeatmapProps {
  appointments: HeatmapAppointment[];
  timezone?: string;
  title?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingHeatmap({ appointments, timezone, title = 'Booking Patterns', className }: BookingHeatmapProps) {
  // Build a 7-day × N-hour grid of counts
  const { grid, maxCount } = useMemo(() => {
    const grid: number[][] = Array.from({ length: HOURS.length }, () => Array(7).fill(0));

    appointments.forEach(appt => {
      if (appt.status === 'cancelled' || appt.status === 'no_show') return;
      try {
        const d = new Date(appt.start_at);
        const hour = timezone
          ? Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: timezone }).format(d))
          : d.getHours();
        const day = timezone
          ? Number(new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: timezone }).format(d).slice(0, 3) === 'Sun' ? 0 : undefined) ||
            new Date(new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(d)).getDay()
          : d.getDay();

        const hi = hour - HOUR_START;
        const di = dayIndex(day);
        if (hi >= 0 && hi < HOURS.length && di >= 0 && di < 7) {
          grid[hi][di]++;
        }
      } catch { /* skip invalid dates */ }
    });

    const maxCount = Math.max(1, ...grid.flat());
    return { grid, maxCount };
  }, [appointments, timezone]);

  const getCellStyle = (count: number) => {
    if (count === 0) return { opacity: 0 };
    const intensity = count / maxCount;
    return { opacity: Math.max(0.12, intensity) };
  };

  const totalBookings = appointments.filter(a => a.status !== 'cancelled' && a.status !== 'no_show').length;

  return (
    <section className={cn("bg-card/75 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{totalBookings} appointments plotted by day &amp; hour</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {[0.1, 0.3, 0.55, 0.75, 1].map((op, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm bg-primary"
              style={{ opacity: op }}
            />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[480px]">
          {/* Day column headers */}
          <div className="flex mb-1 pl-10">
            {DAYS.map(day => (
              <div key={day} className="flex-1 text-center text-[10px] font-bold text-muted-foreground/60 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Hour rows */}
          <div className="space-y-0.5">
            {HOURS.map((hour, hi) => {
              const label = hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
              return (
                <div key={hour} className="flex items-center gap-1">
                  {/* Hour label */}
                  <div className="w-9 text-right text-[10px] text-muted-foreground/50 shrink-0 pr-1">
                    {hi % 2 === 0 ? label : ''}
                  </div>
                  {/* Day cells */}
                  {DAYS.map((_, di) => {
                    const count = grid[hi][di];
                    return (
                      <div key={di} className="flex-1 relative group">
                        <div
                          className="h-5 w-full rounded-sm bg-primary transition-opacity duration-200"
                          style={getCellStyle(count)}
                        />
                        {/* Tooltip */}
                        {count > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 pointer-events-none
                            opacity-0 group-hover:opacity-100 transition-opacity duration-150
                            bg-popover border border-border rounded-lg px-2 py-1 shadow-lg whitespace-nowrap">
                            <p className="text-[11px] font-semibold text-foreground">
                              {DAYS[di]} {label}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {count} booking{count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {totalBookings === 0 && (
        <div className="mt-4 text-center py-6 text-xs text-muted-foreground">
          No booking data to display yet. Patterns will appear as bookings come in.
        </div>
      )}
    </section>
  );
}

export default BookingHeatmap;
