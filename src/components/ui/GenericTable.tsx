"use client";

import { useMemo, useEffect, useRef, ReactNode, Fragment, useCallback } from "react";
import { Icon } from "@iconify/react";
import {
  isWithinInterval,
  parseISO,
  isValid,
} from "date-fns";
import { cn } from "@/lib/utils";
import EmptyState from "./EmptyState";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useState } from "react";

import useTable from "@/hooks/useTable";
import TableFilters, { type DateRange } from "./table/TableFilters";
import TableHeader from "./table/TableHeader";
import TableRow from "./table/TableRow";
import MobileCard from "./table/MobileCard";
import TabletCard from "./table/TabletCard";
import TablePagination from "./table/TablePagination";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TableColumn<T> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  hideOnMobile?: boolean;
  render?: (row: T, index: number) => ReactNode;
}

export interface RowAction<T> {
  icon: string | ((row: T) => string);
  label: string | ((row: T) => string);
  onClick: (row: T) => void;
  variant?: "default" | "danger";
  show?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

export interface BulkAction<T> {
  label: string;
  icon?: string;
  onClick: (rows: T[]) => void;
  variant?: "default" | "danger";
  show?: (rows: T[]) => boolean;
}

export interface GenericTableProps<T> {
  data?: T[];
  columns?: TableColumn<T>[];
  keyExtractor?: (row: T) => string;

  // Toolbar
  title?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  rightContent?: ReactNode;
  extraFilters?: ReactNode;

  // First-class CRUD
  onAddNew?: () => void;
  addNewLabel?: string;
  onEdit?: (row: T) => void;
  onView?: (row: T) => void;
  onDelete?: (row: T) => void;
  canEdit?: boolean;
  deleteMessage?: (row: T) => string;

  // Generic row actions
  actions?: RowAction<T>[];

  // After-actions slot (rendered after delete button)
  afterActions?: (row: T) => ReactNode;

  // Bulk
  selectable?: boolean;
  bulkActions?: BulkAction<T>[];
  onDeleteSelected?: (rows: T[]) => void;
  onSelectionChange?: (selected: string[]) => void;
  showBulkBar?: boolean;

  // Filters
  statusOptions?: Array<{ value: string; label: string }> | string[] | null;
  enableDateFilter?: boolean;
  enableSortFilter?: boolean;
  dateField?: string | string[];
  customFilter?: (row: T, searchTerm: string) => boolean;

  // Export
  enableExport?: boolean;
  exportFilename?: string;
  onExport?: () => void;

  // Refresh
  enableRefresh?: boolean;
  onRefresh?: () => void;

  // Pagination
  showPagination?: boolean;
  defaultPageSize?: number;

  // State
  loading?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;

  // Row
  onRowClick?: (row: T) => void;
  rowClickable?: boolean;
  stickyHeader?: boolean;
  getRowClassName?: (row: T) => string;
  customRowRender?: (row: T, index: number, defaultRow: ReactNode) => ReactNode;
  hideEmptyColumns?: boolean;

  // Layout
  fullPageHeight?: boolean;
  tableMaxHeight?: string;

  className?: string;
}

// ─── CSV export helper ────────────────────────────────────────────────────────

function getNestedVal(obj: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>(
    (acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined),
    obj
  );
}

function exportToCsv<T>(columns: TableColumn<T>[], data: T[], filename: string) {
  const exportCols = columns.filter((c) => !c.render);
  const headers = exportCols.map((c) => `"${c.header}"`).join(",");
  const rows = data.map((row) =>
    exportCols.map((col) => `"${String(getNestedVal(row, col.key) ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton({ cols, selectable, hasActions }: { cols: number; selectable: boolean; hasActions: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-border/40">
          {selectable && (
            <td className="p-4 pl-6 w-10">
              <div className="h-4 w-4 rounded bg-muted" />
            </td>
          )}
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="p-4 first:pl-6">
              <div className="h-3.5 bg-muted rounded-lg" style={{ width: `${55 + (j * 17) % 32}%` }} />
            </td>
          ))}
          {hasActions && (
            <td className="p-4 pr-6">
              <div className="h-7 w-16 bg-muted rounded-lg ml-auto" />
            </td>
          )}
        </tr>
      ))}
    </>
  );
}

// ─── Main GenericTable ────────────────────────────────────────────────────────

function GenericTableInner<T>({
  data = [],
  columns = [],
  keyExtractor,
  title,
  searchable = true,
  searchPlaceholder = "Search…",
  rightContent,
  extraFilters,
  onAddNew,
  addNewLabel = "Add New",
  onEdit,
  onView,
  onDelete,
  canEdit = true,
  deleteMessage,
  actions = [],
  afterActions,
  selectable = true,
  bulkActions = [],
  onDeleteSelected,
  onSelectionChange,
  showBulkBar = true,
  statusOptions = null,
  enableDateFilter = false,
  enableSortFilter = false,
  dateField = "created_at",
  customFilter,
  enableExport = false,
  exportFilename = "export",
  onExport,
  enableRefresh = false,
  onRefresh,
  showPagination = true,
  defaultPageSize = 20,
  loading = false,
  emptyIcon = "solar:document-broken",
  emptyTitle = "No records found",
  emptyDescription,
  onRowClick,
  stickyHeader,
  getRowClassName,
  customRowRender,
  fullPageHeight = false,
  tableMaxHeight,
  className,
}: GenericTableProps<T>) {
  // fullPageHeight makes the table body fill remaining viewport, header sticks
  const derivedMaxHeight = tableMaxHeight ?? (fullPageHeight ? "calc(100vh - var(--header-height, 64px) - 280px)" : undefined);
  const derivedStickyHeader = stickyHeader ?? !!(fullPageHeight || tableMaxHeight);
  // ── Key extractor ───────────────────────────────────────────────────────────
  const getKey = useCallback(
    (row: T) => {
      if (keyExtractor) return keyExtractor(row);
      const r = row as Record<string, unknown>;
      return String(r.id ?? r._id ?? Math.random());
    },
    [keyExtractor]
  );

  // ── Normalize status options ────────────────────────────────────────────────
  const normalizedStatusOptions = useMemo<Array<{ value: string; label: string }> | null>(() => {
    if (!statusOptions || statusOptions.length === 0) return null;
    if (typeof statusOptions[0] === "string") {
      return (statusOptions as string[]).map((s) => ({ value: s, label: s }));
    }
    return statusOptions as Array<{ value: string; label: string }>;
  }, [statusOptions]);

  // ── Date filter state (controlled by TableFilters component) ───────────────
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
    label: "All Time",
  });

  // ── Filter data by date before passing to useTable ─────────────────────────
  const dateFilteredData = useMemo(() => {
    if (!enableDateFilter || !dateRange.startDate || !dateRange.endDate) return data;
    const fields = Array.isArray(dateField) ? dateField : [dateField];
    return data.filter((row) => {
      for (const f of fields) {
        const val = getNestedVal(row, f);
        if (!val) continue;
        const parsed = typeof val === "string" ? parseISO(val) : val instanceof Date ? val : null;
        if (parsed && isValid(parsed) && isWithinInterval(parsed, {
          start: dateRange.startDate!,
          end: dateRange.endDate!,
        })) return true;
      }
      return false;
    });
  }, [data, enableDateFilter, dateRange, dateField]);

  // ── useTable hook ───────────────────────────────────────────────────────────
  const table = useTable(dateFilteredData, defaultPageSize, normalizedStatusOptions, {
    onSelectionChange,
    customFilter: customFilter as any,
  });

  // ── Delete state ────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const triggerDelete = (row: T) => setDeleteTarget(row);

  const confirmDelete = async () => {
    if (!deleteTarget || !onDelete) return;
    setDeleteLoading(true);
    await onDelete(deleteTarget);
    setDeleteLoading(false);
    table.clearSelection();
    setDeleteTarget(null);
  };

  // ── Refresh ─────────────────────────────────────────────────────────────────
  const handleRefresh = () => {
    table.setSearchTerm("");
    table.setStatusFilter("all");
    table.setSortBy("recent");
    table.clearSelection();
    table.setPage(1);
    setDateRange({ startDate: null, endDate: null, label: "All Time" });
    onRefresh?.();
  };

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (onExport) { onExport(); return; }
    exportToCsv(columns, table.filteredData as T[], exportFilename);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const hasActions = (canEdit && (!!onEdit || !!onDelete)) || !!onView || actions.length > 0;
  const selectedRows = data.filter((row) => table.selected.includes(getKey(row)));
  const allPageSelected = table.paged.length > 0 && table.paged.every((r) => table.selected.includes(getKey(r as T)));

  const hasToolbar = title || searchable || onAddNew || normalizedStatusOptions
    || enableDateFilter || enableSortFilter || enableExport || enableRefresh
    || rightContent || extraFilters;

  // ── Shared action props ─────────────────────────────────────────────────────
  const rowActionProps = {
    columns,
    actions,
    afterActions,
    onEdit,
    onView,
    onDelete: canEdit && onDelete ? triggerDelete : undefined,
    canEdit,
    onRowClick,
    getRowClassName,
  };

  return (
    <div className={cn("bg-card/75 backdrop-blur-md border border-border rounded-2xl overflow-hidden shadow-sm", className)}>

      {/* ── Toolbar ── */}
      {hasToolbar && (
        <div className="flex flex-col gap-3 p-4 border-b border-border/50 bg-muted/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {title && <h3 className="text-sm font-bold text-foreground shrink-0">{title}</h3>}
            <div className="sm:ml-auto">
              <TableFilters
                searchTerm={table.searchTerm}
                onSearch={table.setSearchTerm}
                searchPlaceholder={searchPlaceholder}
                statusFilter={table.statusFilter}
                statusOptions={normalizedStatusOptions}
                onStatusFilter={table.setStatusFilter}
                sortBy={table.sortBy}
                onSortBy={table.setSortBy}
                enableSortFilter={enableSortFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                enableDateFilter={enableDateFilter}
                enableRefresh={enableRefresh}
                onRefresh={handleRefresh}
                enableExport={enableExport}
                onExport={handleExport}
                extraFilters={extraFilters}
                rightContent={rightContent}
                onAddNew={onAddNew}
                addNewLabel={addNewLabel}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Action Bar ── */}
      {showBulkBar && selectable && table.selected.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-border/50 bg-primary/5">
          <span className="text-xs font-semibold text-foreground">
            {table.selected.length} selected
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {bulkActions
              .filter((a) => !a.show || a.show(selectedRows))
              .map((action, i) => (
                <button
                  key={i}
                  onClick={() => { action.onClick(selectedRows); table.clearSelection(); }}
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors",
                    action.variant === "danger"
                      ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  )}
                >
                  {action.icon && <Icon icon={action.icon} className="h-3.5 w-3.5" />}
                  {action.label}
                </button>
              ))}
            {canEdit && onDeleteSelected && (
              <button
                onClick={() => { onDeleteSelected(selectedRows); table.clearSelection(); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-colors"
              >
                <Icon icon="solar:trash-bin-trash-broken" className="h-3.5 w-3.5" />
                Delete Selected
              </button>
            )}
            <button onClick={table.clearSelection} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Empty (no data at all) ── */}
      {!loading && data.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription ?? ""} />
      ) : table.isMobile ? (
        /* ── Mobile Cards ── */
        <div>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse border-b border-border/40 p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))
          ) : table.paged.length === 0 ? (
            <EmptyState icon="solar:document-search-broken" title="No results" description="Try adjusting your search or filters." />
          ) : (
            (table.paged as T[]).map((row, index) => {
              const key = getKey(row);
              return (
                <MobileCard
                  key={key}
                  row={row}
                  index={index}
                  selectable={selectable}
                  isSelected={table.selected.includes(key)}
                  onToggle={() => table.toggleSelect(key)}
                  {...rowActionProps}
                />
              );
            })
          )}
        </div>
      ) : table.isTablet ? (
        /* ── Tablet Cards ── */
        <div>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse border-b border-border/40 p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))
          ) : table.paged.length === 0 ? (
            <EmptyState icon="solar:document-search-broken" title="No results" description="Try adjusting your search or filters." />
          ) : (
            (table.paged as T[]).map((row, index) => {
              const key = getKey(row);
              return (
                <TabletCard
                  key={key}
                  row={row}
                  index={index}
                  selectable={selectable}
                  isSelected={table.selected.includes(key)}
                  onToggle={() => table.toggleSelect(key)}
                  {...rowActionProps}
                />
              );
            })
          )}
        </div>
      ) : (
        /* ── Desktop Table ── */
        <div
          className="overflow-x-auto"
          style={derivedMaxHeight ? { maxHeight: derivedMaxHeight, overflowY: "auto" } : undefined}
        >
          <table className="w-full text-left border-collapse">
            <TableHeader
              columns={columns}
              selectable={selectable}
              hasActions={hasActions}
              sortKey={table.sortKey}
              sortDir={table.sortDir}
              allSelected={allPageSelected}
              onSelectAll={() => table.selectAll((table.paged as T[]).map(getKey))}
              onSort={(col) => table.handleSort(col.key)}
              stickyHeader={derivedStickyHeader}
            />
            <tbody className="divide-y divide-border/40 text-sm">
              {loading ? (
                <TableSkeleton cols={columns.length} selectable={selectable} hasActions={hasActions} />
              ) : table.paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)} className="py-4">
                    <EmptyState icon="solar:document-search-broken" title="No results" description="Try adjusting your search or filters." />
                  </td>
                </tr>
              ) : (
                (table.paged as T[]).map((row, index) => {
                  const key = getKey(row);
                  const defaultRow = (
                    <TableRow
                      key={key}
                      row={row}
                      index={index}
                      selectable={selectable}
                      isSelected={table.selected.includes(key)}
                      onToggle={() => table.toggleSelect(key)}
                      {...rowActionProps}
                    />
                  );
                  return customRowRender
                    ? <Fragment key={key}>{customRowRender(row, index, defaultRow)}</Fragment>
                    : <Fragment key={key}>{defaultRow}</Fragment>;
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {showPagination && !loading && (
        <TablePagination
          page={table.page}
          pageSize={table.pageSize}
          totalItems={table.totalItems}
          totalPages={table.totalPages}
          onPage={table.handlePage}
          onPageSize={table.setPageSize}
        />
      )}

      {/* ── Delete Confirm ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        variant="danger"
        title="Delete this record?"
        description={deleteTarget && deleteMessage ? deleteMessage(deleteTarget) : "This action cannot be undone."}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
}

export { GenericTableInner as GenericTable };
export default GenericTableInner;
