"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import type { TableColumn } from "../GenericTable";

const alignClass: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

interface TableHeaderProps<T> {
  columns: TableColumn<T>[];
  selectable: boolean;
  hasActions: boolean;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  allSelected: boolean;
  onSelectAll: () => void;
  onSort: (col: TableColumn<T>) => void;
  stickyHeader?: boolean;
}

export default function TableHeader<T>({
  columns,
  selectable,
  hasActions,
  sortKey,
  sortDir,
  allSelected,
  onSelectAll,
  onSort,
  stickyHeader = false,
}: TableHeaderProps<T>) {
  return (
    <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
      <tr className="border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase bg-muted/20 transition-colors">
        {selectable && (
          <th className="p-4 pl-6 w-10">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              aria-label="Select all"
            />
          </th>
        )}
        {columns.map((col) => (
          <th
            key={col.key}
            style={{ width: col.width }}
            className={cn(
              "p-4 first:pl-6 select-none whitespace-nowrap",
              col.hideOnMobile && "hidden sm:table-cell",
              alignClass[col.align ?? "left"],
              col.sortable !== false && "cursor-pointer hover:text-foreground transition-colors"
            )}
            onClick={() => col.sortable !== false && onSort(col)}
          >
            <span className="inline-flex items-center gap-1">
              {col.header}
              {col.sortable !== false && (
                sortKey === col.key ? (
                  <Icon
                    icon={sortDir === "asc" ? "solar:alt-arrow-up-broken" : "solar:alt-arrow-down-broken"}
                    className="w-3 h-3 text-primary"
                  />
                ) : (
                  <div className="flex flex-col opacity-30">
                    <Icon icon="solar:alt-arrow-up-broken" className="w-2.5 h-2.5" />
                    <Icon icon="solar:alt-arrow-down-broken" className="w-2.5 h-2.5 -mt-0.5" />
                  </div>
                )
              )}
            </span>
          </th>
        ))}
        {hasActions && (
          <th className="p-4 pr-6 text-right w-28 whitespace-nowrap">Actions</th>
        )}
      </tr>
    </thead>
  );
}
