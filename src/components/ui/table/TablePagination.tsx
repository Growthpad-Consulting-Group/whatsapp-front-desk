"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 20, 50, 100];

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}

export default function TablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPage,
  onPageSize,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  // Build page list with ellipsis
  const pages: (number | "…")[] = [];
  const range = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  range.forEach((p, i) => {
    if (i > 0 && (p as number) - (range[i - 1] as number) > 1) pages.push("…");
    pages.push(p);
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-border/50 bg-muted/10">
      {/* Rows info + size selector */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Rows:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="h-7 px-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="hidden sm:inline">
          {start}–{end} of {totalItems}
        </span>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <NavBtn
          icon="solar:double-alt-arrow-left-broken"
          label="First"
          disabled={page === 1}
          onClick={() => onPage(1)}
        />
        <NavBtn
          icon="solar:alt-arrow-left-broken"
          label="Previous"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
        />
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={cn(
                "h-7 w-7 rounded-lg border text-xs font-semibold transition-colors",
                p === page
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {p}
            </button>
          )
        )}
        <NavBtn
          icon="solar:alt-arrow-right-broken"
          label="Next"
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
        />
        <NavBtn
          icon="solar:double-alt-arrow-right-broken"
          label="Last"
          disabled={page === totalPages}
          onClick={() => onPage(totalPages)}
        />
      </div>
    </div>
  );
}

function NavBtn({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <Icon icon={icon} className="h-3.5 w-3.5" />
    </button>
  );
}
