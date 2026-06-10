'use client';

/**
 * DatePicker — single-date picker with a month-grid calendar in a portal Popover.
 * Adapted from the bflowpos DateRangePicker / SelectPopover pattern.
 *
 * Uses date-fns for month math. No additional library required.
 *
 * Usage:
 *   <DatePicker
 *     value="2026-06-15"          // ISO date string YYYY-MM-DD, or empty string
 *     onChange={(v) => setDate(v)} // returns YYYY-MM-DD string or ""
 *     placeholder="Pick a date"
 *     minDate="2026-06-01"        // optional
 *     maxDate="2026-12-31"        // optional
 *   />
 */

import { useRef, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { Popover } from '@/components/ui/Popover';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DatePickerProps {
  /** ISO date string YYYY-MM-DD, or empty string for no selection */
  value: string;
  /** Called with YYYY-MM-DD string, or empty string to clear */
  onChange: (value: string) => void;
  placeholder?: string;
  /** ISO date string — days before this are disabled */
  minDate?: string;
  /** ISO date string — days after this are disabled */
  maxDate?: string;
  disabled?: boolean;
  /** Extra CSS classes on the trigger button */
  className?: string;
  /** Width of the calendar popover in px (default 280) */
  popoverWidth?: number;
  /** Show a clear button when a date is selected (default true) */
  clearable?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function isoToDate(iso: string): Date | null {
  if (!iso) return null;
  try { return parseISO(iso); } catch { return null; }
}

function dateToIso(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function buildCalendarGrid(viewDate: Date): Date[][] {
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  // Week starts Monday
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

// ─── MonthCalendar ──────────────────────────────────────────────────────────────

interface MonthCalendarProps {
  selected: Date | null;
  viewDate: Date;
  minDate: Date | null;
  maxDate: Date | null;
  onSelectDay: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function MonthCalendar({
  selected,
  viewDate,
  minDate,
  maxDate,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: MonthCalendarProps) {
  const weeks = buildCalendarGrid(viewDate);

  const isDisabled = (d: Date) => {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };

  return (
    <div className="p-3 select-none">
      {/* Month / year header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-1 rounded-lg hover:bg-muted transition-colors"
          aria-label="Previous month"
        >
          <Icon icon="solar:arrow-left-broken" className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-bold text-foreground">
          {format(viewDate, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-1 rounded-lg hover:bg-muted transition-colors"
          aria-label="Next month"
        >
          <Icon icon="solar:arrow-right-broken" className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-muted-foreground/60 uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((day, di) => {
            const inMonth = isSameMonth(day, viewDate);
            const isSelected = selected ? isSameDay(day, selected) : false;
            const isTodayDay = isToday(day);
            const disabled = isDisabled(day);

            return (
              <button
                key={di}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onSelectDay(day)}
                className={cn(
                  "relative h-8 w-full rounded-lg text-xs font-medium transition-all duration-100",
                  // Base state
                  !disabled && "hover:bg-primary/10 cursor-pointer",
                  disabled && "opacity-30 cursor-not-allowed",
                  // Out-of-month days
                  !inMonth && "text-muted-foreground/40",
                  inMonth && !isSelected && !isTodayDay && "text-foreground",
                  // Today
                  isTodayDay && !isSelected && "text-primary font-bold",
                  // Selected
                  isSelected && "bg-primary text-primary-foreground font-bold shadow-sm hover:bg-primary"
                )}
              >
                {day.getDate()}
                {isTodayDay && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── DatePicker ─────────────────────────────────────────────────────────────────

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  minDate: minDateStr,
  maxDate: maxDateStr,
  disabled = false,
  className = '',
  popoverWidth = 280,
  clearable = true,
}: DatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => {
    const selected = isoToDate(value);
    return selected ?? new Date();
  });

  const selected = isoToDate(value);
  const minDate = isoToDate(minDateStr ?? '');
  const maxDate = isoToDate(maxDateStr ?? '');

  const handleSelectDay = (d: Date) => {
    onChange(dateToIso(d));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const handleOpen = () => {
    if (disabled) return;
    // Sync view to current selection
    setViewDate(selected ?? new Date());
    setIsOpen(true);
  };

  const displayValue = selected ? format(selected, 'dd MMM yyyy') : '';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          "group relative flex items-center h-10 w-full rounded-xl border border-border bg-background px-3 text-sm transition-all",
          "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "border-primary ring-2 ring-primary",
          className
        )}
      >
        <Icon
          icon="solar:calendar-broken"
          className={cn(
            "h-4 w-4 shrink-0 mr-2 transition-colors",
            isOpen ? "text-primary" : "text-muted-foreground"
          )}
        />
        <span className={cn("flex-1 text-left truncate", !displayValue && "text-muted-foreground/60")}>
          {displayValue || placeholder}
        </span>
        {clearable && selected && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear date"
            onClick={handleClear}
            onKeyDown={(e) => e.key === 'Enter' && handleClear(e as any)}
            className="ml-1 p-0.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Icon icon="solar:close-circle-broken" className="h-3.5 w-3.5" />
          </span>
        )}
        {(!clearable || !selected) && (
          <Icon
            icon="solar:alt-arrow-down-broken"
            className={cn("h-3.5 w-3.5 ml-1 text-muted-foreground transition-transform duration-150", isOpen && "rotate-180")}
          />
        )}
      </button>

      <Popover
        triggerRef={triggerRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        width={popoverWidth}
      >
        <MonthCalendar
          selected={selected}
          viewDate={viewDate}
          minDate={minDate}
          maxDate={maxDate}
          onSelectDay={handleSelectDay}
          onPrevMonth={() => setViewDate((v) => subMonths(v, 1))}
          onNextMonth={() => setViewDate((v) => addMonths(v, 1))}
        />
      </Popover>
    </>
  );
}

export default DatePicker;
