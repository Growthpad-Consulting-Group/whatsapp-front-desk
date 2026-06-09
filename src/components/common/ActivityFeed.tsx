"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

interface ActivityFeedProps<T> {
  items: T[];
  getDate: (item: T) => string;
  getId: (item: T) => string;
  renderRow: (
    item: T,
    isSelected: boolean,
    onClick: () => void,
    index: number,
  ) => React.ReactNode;
  loading?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  selectedId?: string | null;
  onSelect?: (item: T | null) => void;
  className?: string;
}

function groupByDate<T>(items: T[], getDate: (item: T) => string) {
  const groups: { date: string; entries: T[] }[] = [];
  for (const item of items) {
    const date = new Date(getDate(item)).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.entries.push(item);
    else groups.push({ date, entries: [item] });
  }
  return groups;
}

export function ActivityFeed<T>({
  items,
  getDate,
  getId,
  renderRow,
  loading = false,
  emptyIcon = "solar:history-broken",
  emptyTitle = "No activity yet",
  emptyDescription = "Actions will appear here.",
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  selectedId,
  onSelect,
  className = "",
}: ActivityFeedProps<T>) {
  if (loading) {
    return (
      <div className={`rounded-2xl border border-border bg-card overflow-hidden ${className}`}>
        <div className="flex flex-col gap-3 p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse bg-muted"
              style={{ opacity: 1 - i * 0.12 }}
            />
          ))}
        </div>
      </div>
    );
  }

  const groups = groupByDate(items, getDate);

  if (groups.length === 0) {
    return (
      <div className={`rounded-2xl border border-border bg-card overflow-hidden ${className}`}>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Icon icon={emptyIcon} className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">{emptyTitle}</p>
          <p className="text-xs text-muted-foreground/70">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-border bg-card overflow-hidden ${className}`}>
      {groups.map((group) => (
        <div key={group.date}>
          {/* Date header */}
          <div className="flex items-center gap-2.5 px-5 py-2.5 sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
            <Icon icon="solar:calendar-broken" className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-bold text-muted-foreground">{group.date}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">
              {group.entries.length}
            </span>
          </div>

          {/* Rows */}
          {group.entries.map((item, entryIdx) => {
            const id = getId(item);
            const globalIdx =
              groups
                .slice(0, groups.indexOf(group))
                .reduce((sum, g) => sum + g.entries.length, 0) + entryIdx;
            return (
              <motion.div key={id} layout>
                {renderRow(
                  item,
                  selectedId === id,
                  () => onSelect?.(selectedId === id ? null : item),
                  globalIdx,
                )}
              </motion.div>
            );
          })}
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-border">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon icon="solar:alt-arrow-left-broken" className="w-4 h-4" />
            Previous
          </button>
          <span className="text-xs font-medium text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <Icon icon="solar:alt-arrow-right-broken" className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;
