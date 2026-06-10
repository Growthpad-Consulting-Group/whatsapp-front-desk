'use client';

import { useRef, useState } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth,
  isToday, parseISO, isWithinInterval, isBefore, subDays,
} from 'date-fns';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { Popover } from '@/components/ui/Popover';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DateRangeValue {
  start: string;  // YYYY-MM-DD or ""
  end: string;    // YYYY-MM-DD or ""
  label: string;
}

export interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toISO(d: Date) { return format(d, 'yyyy-MM-dd'); }

function buildGrid(viewDate: Date): Date[][] {
  const monthStart = startOfMonth(viewDate);
  const monthEnd   = endOfMonth(viewDate);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days       = eachDayOfInterval({ start: calStart, end: calEnd });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

// ─── Presets ─────────────────────────────────────────────────────────────────

interface Preset {
  label: string;
  icon: string;
  getRange: (() => { start: string; end: string }) | null;
}

const PRESETS: Preset[] = [
  {
    label: 'Today',
    icon: 'solar:sun-broken',
    getRange: () => { const d = new Date(); return { start: toISO(d), end: toISO(d) }; },
  },
  {
    label: 'Yesterday',
    icon: 'solar:history-2-broken',
    getRange: () => { const d = subDays(new Date(), 1); return { start: toISO(d), end: toISO(d) }; },
  },
  {
    label: 'Last 7 Days',
    icon: 'solar:calendar-broken',
    getRange: () => { const e = new Date(); return { start: toISO(subDays(e, 6)), end: toISO(e) }; },
  },
  {
    label: 'Last 30 Days',
    icon: 'solar:calendar-date-broken',
    getRange: () => { const e = new Date(); return { start: toISO(subDays(e, 29)), end: toISO(e) }; },
  },
  {
    label: 'This Month',
    icon: 'solar:calendar-minimalistic-broken',
    getRange: () => { const n = new Date(); return { start: toISO(startOfMonth(n)), end: toISO(endOfMonth(n)) }; },
  },
  {
    label: 'Last Month',
    icon: 'solar:rewind-back-broken',
    getRange: () => { const l = subMonths(new Date(), 1); return { start: toISO(startOfMonth(l)), end: toISO(endOfMonth(l)) }; },
  },
  {
    label: 'Custom Range',
    icon: 'solar:pen-new-square-broken',
    getRange: null,
  },
];

// ─── Range Month Calendar ─────────────────────────────────────────────────────

interface RangeMonthProps {
  viewDate: Date;
  pendingStart: Date | null;
  pendingEnd: Date | null;
  hoverDate: Date | null;
  onHover: (d: Date | null) => void;
  onDayClick: (d: Date) => void;
  onPrev?: () => void;
  onNext?: () => void;
  showPrev?: boolean;
  showNext?: boolean;
}

function RangeMonth({
  viewDate, pendingStart, pendingEnd, hoverDate,
  onHover, onDayClick, onPrev, onNext,
  showPrev = true, showNext = true,
}: RangeMonthProps) {
  const weeks = buildGrid(viewDate);

  // Compute effective range (pending or hover preview)
  const rangeEnd = pendingEnd ?? (pendingStart ? hoverDate : null);
  let rangeFrom: Date | null = null;
  let rangeTo: Date | null = null;
  if (pendingStart && rangeEnd) {
    [rangeFrom, rangeTo] = isBefore(pendingStart, rangeEnd)
      ? [pendingStart, rangeEnd]
      : [rangeEnd, pendingStart];
  }

  return (
    <div className="p-3 select-none w-[196px] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onPrev}
          className={cn("p-1 rounded-lg hover:bg-muted transition-colors", !showPrev && "invisible")}
          aria-label="Previous month"
        >
          <Icon icon="solar:arrow-left-broken" className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <span className="text-xs font-bold text-foreground">{format(viewDate, 'MMMM yyyy')}</span>
        <button
          type="button"
          onClick={onNext}
          className={cn("p-1 rounded-lg hover:bg-muted transition-colors", !showNext && "invisible")}
          aria-label="Next month"
        >
          <Icon icon="solar:arrow-right-broken" className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-0.5">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-muted-foreground/50 uppercase py-0.5">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((day, di) => {
            const inMonth  = isSameMonth(day, viewDate);
            const isStart  = pendingStart ? isSameDay(day, pendingStart) : false;
            const isEnd    = pendingEnd   ? isSameDay(day, pendingEnd)   : false;
            const isTodayD = isToday(day);
            const inRange  = rangeFrom && rangeTo
              ? isWithinInterval(day, { start: rangeFrom, end: rangeTo })
              : false;
            const isEndpt  = isStart || isEnd;

            return (
              <button
                key={di}
                type="button"
                onClick={() => onDayClick(day)}
                onMouseEnter={() => onHover(day)}
                onMouseLeave={() => onHover(null)}
                className={cn(
                  "relative h-7 flex items-center justify-center text-[11px] font-medium transition-all duration-75 cursor-pointer",
                  // Range bar (full-width, no border-radius except endpoints)
                  inRange && !isEndpt && "bg-primary/15",
                  inRange && isStart && "bg-primary/15 rounded-l-full",
                  inRange && isEnd   && "bg-primary/15 rounded-r-full",
                  // When same day = start & end, no bar
                  isStart && isEnd   && "!bg-transparent",
                )}
              >
                <span className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-[11px] transition-all",
                  !inMonth && "text-muted-foreground/25",
                  inMonth && !isEndpt && "hover:bg-primary/15",
                  isTodayD && !isEndpt && "text-primary font-bold",
                  inMonth && !isEndpt && !isTodayD && "text-foreground",
                  isEndpt && "bg-primary text-primary-foreground font-bold shadow-sm",
                )}>
                  {day.getDate()}
                </span>
                {isTodayD && !isEndpt && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── DateRangePicker ──────────────────────────────────────────────────────────

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  disabled = false,
  className,
}: DateRangePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  // Calendar state for custom range
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [pendingEnd, setPendingEnd]     = useState<Date | null>(null);
  const [hoverDate, setHoverDate]       = useState<Date | null>(null);
  const [leftMonth, setLeftMonth]       = useState<Date>(startOfMonth(new Date()));
  const [rightMonth, setRightMonth]     = useState<Date>(startOfMonth(addMonths(new Date(), 1)));

  const handleOpen = () => {
    if (disabled) return;
    // Sync calendar to current value
    const initDate = value.start ? parseISO(value.start) : new Date();
    setLeftMonth(startOfMonth(initDate));
    setRightMonth(startOfMonth(addMonths(initDate, 1)));
    setPendingStart(value.start ? parseISO(value.start) : null);
    setPendingEnd(value.end ? parseISO(value.end) : null);
    setShowCustom(value.label === 'Custom Range');
    setHoverDate(null);
    setIsOpen(true);
  };

  const handlePresetClick = (preset: Preset) => {
    if (preset.label === 'Custom Range') {
      setShowCustom(true);
      setPendingStart(null);
      setPendingEnd(null);
      setLeftMonth(startOfMonth(new Date()));
      setRightMonth(startOfMonth(addMonths(new Date(), 1)));
      return;
    }
    if (preset.getRange) {
      const { start, end } = preset.getRange();
      onChange({ start, end, label: preset.label });
      setIsOpen(false);
    }
  };

  const handleDayClick = (day: Date) => {
    if (!pendingStart || (pendingStart && pendingEnd)) {
      setPendingStart(day);
      setPendingEnd(null);
    } else {
      if (isBefore(day, pendingStart)) {
        setPendingEnd(pendingStart);
        setPendingStart(day);
      } else {
        setPendingEnd(day);
      }
    }
  };

  const handleApply = () => {
    if (!pendingStart || !pendingEnd) return;
    const [s, e] = isBefore(pendingStart, pendingEnd)
      ? [pendingStart, pendingEnd]
      : [pendingEnd, pendingStart];
    onChange({ start: toISO(s), end: toISO(e), label: 'Custom Range' });
    setIsOpen(false);
  };

  const handleClear = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    onChange({ start: '', end: '', label: '' });
  };

  // Derive display label
  const displayLabel = (() => {
    if (!value.label) return '';
    if (value.label === 'Custom Range' && value.start && value.end) {
      try {
        return `${format(parseISO(value.start), 'dd MMM')} – ${format(parseISO(value.end), 'dd MMM yyyy')}`;
      } catch { return 'Custom Range'; }
    }
    return value.label;
  })();

  const canApply = !!(pendingStart && pendingEnd);

  const footerLabel = (() => {
    if (!pendingStart) return 'Click a start date';
    if (!pendingEnd) {
      return `${format(pendingStart, 'dd MMM yyyy')} — pick end date`;
    }
    const [s, e] = isBefore(pendingStart, pendingEnd)
      ? [pendingStart, pendingEnd]
      : [pendingEnd, pendingStart];
    return `${format(s, 'dd MMM')} – ${format(e, 'dd MMM yyyy')}`;
  })();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          "group flex items-center h-10 rounded-xl border border-border bg-background px-3 text-sm transition-all",
          "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "border-primary ring-2 ring-primary",
          className
        )}
      >
        <Icon
          icon="solar:calendar-date-broken"
          className={cn("h-4 w-4 shrink-0 mr-2 transition-colors", isOpen ? "text-primary" : "text-muted-foreground")}
        />
        <span className={cn("flex-1 text-left truncate", !displayLabel && "text-muted-foreground/60")}>
          {displayLabel || placeholder}
        </span>
        {value.start ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear range"
            onClick={handleClear}
            onKeyDown={e => e.key === 'Enter' && handleClear(e as any)}
            className="ml-1 p-0.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Icon icon="solar:close-circle-broken" className="h-3.5 w-3.5" />
          </span>
        ) : (
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
        width={560}
        className="max-w-[calc(100vw-2rem)]"
      >
        <div className="flex">
          {/* ── Preset list ── */}
          <div className="flex flex-col py-2 w-40 shrink-0 border-r border-border/50">
            <p className="px-4 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Quick select
            </p>
            {PRESETS.map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2 text-left text-sm font-medium transition-colors",
                  value.label === preset.label && !showCustom && preset.label !== 'Custom Range'
                    ? "bg-primary/10 text-primary"
                    : showCustom && preset.label === 'Custom Range'
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Icon icon={preset.icon} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{preset.label}</span>
              </button>
            ))}
          </div>

          {/* ── Right panel ── */}
          {showCustom ? (
            // Custom range: dual-month calendar
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex divide-x divide-border/50">
                <RangeMonth
                  viewDate={leftMonth}
                  pendingStart={pendingStart}
                  pendingEnd={pendingEnd}
                  hoverDate={hoverDate}
                  onHover={setHoverDate}
                  onDayClick={handleDayClick}
                  onPrev={() => { setLeftMonth(m => subMonths(m, 1)); setRightMonth(m => subMonths(m, 1)); }}
                  showNext={false}
                />
                <RangeMonth
                  viewDate={rightMonth}
                  pendingStart={pendingStart}
                  pendingEnd={pendingEnd}
                  hoverDate={hoverDate}
                  onHover={setHoverDate}
                  onDayClick={handleDayClick}
                  showPrev={false}
                  onNext={() => { setLeftMonth(m => addMonths(m, 1)); setRightMonth(m => addMonths(m, 1)); }}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/20">
                <span className="text-xs text-muted-foreground truncate mr-3">{footerLabel}</span>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setPendingStart(null); setPendingEnd(null); }}
                    className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition-colors font-medium"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!canApply}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors",
                      canApply
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Placeholder panel
            <div className="flex-1 flex flex-col items-center justify-center py-10 px-6 text-center">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <Icon icon="solar:calendar-date-broken" className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Pick a time range</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select a preset from the left, or choose{' '}
                <button
                  type="button"
                  onClick={() => handlePresetClick(PRESETS[PRESETS.length - 1])}
                  className="text-primary font-semibold hover:underline"
                >
                  Custom Range
                </button>{' '}
                for a specific window.
              </p>
            </div>
          )}
        </div>
      </Popover>
    </>
  );
}

export default DateRangePicker;
