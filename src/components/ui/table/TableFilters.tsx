"use client";

import { useState, ReactNode } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  startOfDay, endOfDay, subDays, startOfMonth, endOfMonth,
} from "date-fns";

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  label: string;
}

const DATE_PRESETS: Array<{ label: string; getRange: () => DateRange }> = [
  { label: "All Time", getRange: () => ({ startDate: null, endDate: null, label: "All Time" }) },
  { label: "Today", getRange: () => ({ startDate: startOfDay(new Date()), endDate: endOfDay(new Date()), label: "Today" }) },
  {
    label: "Yesterday",
    getRange: () => {
      const d = subDays(new Date(), 1);
      return { startDate: startOfDay(d), endDate: endOfDay(d), label: "Yesterday" };
    },
  },
  { label: "Last 7 Days", getRange: () => ({ startDate: startOfDay(subDays(new Date(), 6)), endDate: endOfDay(new Date()), label: "Last 7 Days" }) },
  { label: "Last 30 Days", getRange: () => ({ startDate: startOfDay(subDays(new Date(), 29)), endDate: endOfDay(new Date()), label: "Last 30 Days" }) },
  { label: "This Month", getRange: () => ({ startDate: startOfMonth(new Date()), endDate: endOfMonth(new Date()), label: "This Month" }) },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recently Added" },
  { value: "asc", label: "A → Z" },
  { value: "desc", label: "Z → A" },
];

interface TableFiltersProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  searchPlaceholder?: string;

  statusFilter?: string;
  statusOptions?: Array<{ value: string; label: string }> | null;
  onStatusFilter?: (status: string) => void;

  sortBy?: string;
  onSortBy?: (sort: string) => void;
  enableSortFilter?: boolean;

  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  enableDateFilter?: boolean;

  enableRefresh?: boolean;
  onRefresh?: () => void;

  extraFilters?: ReactNode;
  rightContent?: ReactNode;

  onAddNew?: () => void;
  addNewLabel?: string;

  enableExport?: boolean;
  onExport?: () => void;
}

export default function TableFilters({
  searchTerm,
  onSearch,
  searchPlaceholder = "Search…",
  statusFilter = "all",
  statusOptions,
  onStatusFilter,
  sortBy = "recent",
  onSortBy,
  enableSortFilter = false,
  dateRange,
  onDateRangeChange,
  enableDateFilter = false,
  enableRefresh = false,
  onRefresh,
  extraFilters,
  rightContent,
  onAddNew,
  addNewLabel = "Add New",
  enableExport = false,
  onExport,
}: TableFiltersProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status filter */}
      {statusOptions && onStatusFilter && (
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Status</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {/* Sort filter */}
      {enableSortFilter && onSortBy && (
        <select
          value={sortBy}
          onChange={(e) => onSortBy(e.target.value)}
          className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {/* Date filter */}
      {enableDateFilter && dateRange && onDateRangeChange && (
        <select
          value={dateRange.label}
          onChange={(e) => {
            const preset = DATE_PRESETS.find((p) => p.label === e.target.value);
            if (preset) onDateRangeChange(preset.getRange());
          }}
          className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {DATE_PRESETS.map((p) => (
            <option key={p.label} value={p.label}>{p.label}</option>
          ))}
        </select>
      )}

      {extraFilters}

      {/* Refresh */}
      {enableRefresh && (
        <button
          title="Refresh"
          onClick={onRefresh}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Icon icon="solar:refresh-broken" className="h-4 w-4" />
        </button>
      )}

      {/* Export */}
      {enableExport && (
        <button
          title="Export CSV"
          onClick={onExport}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Icon icon="solar:export-broken" className="h-4 w-4" />
        </button>
      )}

      {/* Collapsible animated search */}
      <div className={cn(
        "relative transition-all duration-300 ease-in-out",
        isSearchExpanded || searchTerm ? "w-56" : "w-9"
      )}>
        <Icon
          icon="solar:magnifer-broken"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none"
        />
        <input
          type="text"
          placeholder={isSearchExpanded || searchTerm ? searchPlaceholder : ""}
          value={searchTerm}
          onFocus={() => setIsSearchExpanded(true)}
          onBlur={() => { if (!searchTerm) setIsSearchExpanded(false); }}
          onChange={(e) => onSearch(e.target.value)}
          className={cn(
            "h-9 w-full pl-9 rounded-xl border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 bg-background border-border",
            isSearchExpanded || searchTerm ? "pr-8 placeholder:text-muted-foreground cursor-text" : "pr-0 cursor-pointer"
          )}
        />
        {searchTerm && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 transition-colors"
          >
            <Icon icon="solar:close-circle-broken" className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Add New */}
      {onAddNew && (
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm shrink-0"
        >
          <Icon icon="solar:add-circle-broken" className="h-4 w-4" />
          {addNewLabel}
        </button>
      )}

      {rightContent && <div className="flex items-center">{rightContent}</div>}
    </div>
  );
}
