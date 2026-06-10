'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
import { SimpleModal } from '@/components/common/SimpleModal';

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
  id?: string;
  start_at: string;
  status?: string;
  customers?: { name: string | null; phone: string | null } | null;
  services?: { name: string | null } | null;
  staff_members?: { name: string | null } | null;
}

export interface BookingHeatmapProps {
  appointments: HeatmapAppointment[];
  timezone?: string;
  title?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingHeatmap({ appointments, timezone, title = 'Booking Patterns', className }: BookingHeatmapProps) {
  const [selectedSlot, setSelectedSlot] = useState<{ dayIndex: number; hour: number; appointments: HeatmapAppointment[] } | null>(null);

  // Build a 7-day × N-hour grid of appointments
  const { grid, maxCount } = useMemo(() => {
    const grid: HeatmapAppointment[][][] = Array.from(
      { length: HOURS.length },
      () => Array.from({ length: 7 }, () => [])
    );

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
          grid[hi][di].push(appt);
        }
      } catch { /* skip invalid dates */ }
    });

    const counts = grid.flatMap(row => row.map(cell => cell.length));
    const maxCount = Math.max(1, ...counts);
    return { grid, maxCount };
  }, [appointments, timezone]);

  const getCellStyle = (count: number) => {
    if (count === 0) return undefined;
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
                    const cellAppts = grid[hi][di];
                    const count = cellAppts.length;
                    return (
                      <div key={di} className="flex-1 relative group">
                        <button
                          type="button"
                          onClick={() => {
                            if (count > 0) {
                              setSelectedSlot({
                                dayIndex: di,
                                hour,
                                appointments: cellAppts,
                              });
                            }
                          }}
                          disabled={count === 0}
                          className={cn(
                            "h-5 w-full rounded-sm transition-all duration-200 block border-0 p-0 outline-none",
                            count === 0
                              ? "bg-slate-100 dark:bg-slate-900/60 cursor-default"
                              : "bg-primary cursor-pointer hover:scale-105 active:scale-95 shadow-sm hover:shadow-md hover:ring-2 hover:ring-primary/25"
                          )}
                          style={getCellStyle(count)}
                          aria-label={`${count} booking${count !== 1 ? 's' : ''} on ${DAYS[di]} at ${label}`}
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

      {/* Bookings Detail Modal */}
      <SimpleModal
        isOpen={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        title={`Bookings - ${selectedSlot ? DAYS[selectedSlot.dayIndex] : ''}s at ${selectedSlot ? (selectedSlot.hour === 12 ? '12 PM' : selectedSlot.hour < 12 ? `${selectedSlot.hour} AM` : `${selectedSlot.hour - 12} PM`) : ''}`}
        subtitle={`${selectedSlot?.appointments.length} appointment${selectedSlot && selectedSlot.appointments.length !== 1 ? 's' : ''} in this time slot over the last 30 days.`}
        icon="solar:calendar-broken"
        width="max-w-md"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
          {selectedSlot?.appointments.map((appt, i) => {
            const timeStr = new Date(appt.start_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              timeZone: timezone,
            });
            const formattedTime = new Date(appt.start_at).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: timezone,
            });

            return (
              <div
                key={appt.id || i}
                className="flex flex-col bg-muted/20 border border-border/60 rounded-2xl p-4 gap-3.5 transition-all duration-200 hover:bg-muted/40"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-foreground text-sm leading-snug truncate">
                      {appt.services?.name || "Service Details"}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 font-semibold flex items-center gap-1.5">
                      <Icon icon="solar:calendar-date-broken" className="w-3.5 h-3.5 text-muted-foreground/75" />
                      {timeStr} at {formattedTime}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0",
                    appt.status === "confirmed" ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                    appt.status === "pending" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                    appt.status === "completed" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                    "bg-muted text-muted-foreground border border-border/50"
                  )}>
                    {appt.status || "confirmed"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-card/50 border border-border/30 rounded-xl p-3 text-xs">
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted-foreground block font-medium">Customer</span>
                    <span className="font-bold text-foreground truncate block mt-0.5">
                      {appt.customers?.name || "Client"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted-foreground block font-medium">Phone</span>
                    <span className="font-bold text-foreground truncate block mt-0.5">
                      {appt.customers?.phone || "No Phone"}
                    </span>
                  </div>
                  <div className="col-span-2 border-t border-border/30 pt-2 mt-1 min-w-0">
                    <span className="text-[10px] text-muted-foreground block font-medium">Assigned Staff</span>
                    <span className="font-bold text-foreground truncate block mt-0.5">
                      {appt.staff_members?.name || "Unassigned"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/bookings?search=${encodeURIComponent(appt.customers?.name || '')}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground transition-all duration-200"
                  >
                    <Icon icon="solar:calendar-broken" className="w-4 h-4 text-muted-foreground" />
                    Manage Booking
                  </a>
                  {appt.customers?.phone && (
                    <a
                      href={`/messages?chat=${appt.customers?.phone}`}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 shrink-0"
                      title="Send WhatsApp Message"
                    >
                      <Icon icon="solar:chat-square-broken" className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SimpleModal>
    </section>
  );
}

export default BookingHeatmap;
