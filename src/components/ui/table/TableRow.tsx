"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { getNestedValue, isDateField, formatDateValue, formatDisplayValue } from "./TableUtils";
import type { TableColumn, RowAction } from "../GenericTable";

const alignClass: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

interface TableRowProps<T> {
  row: T;
  index: number;
  columns: TableColumn<T>[];
  selectable: boolean;
  isSelected: boolean;
  onToggle: () => void;
  actions: RowAction<T>[];
  onEdit?: (row: T) => void;
  onView?: (row: T) => void;
  onDelete?: (row: T) => void;
  canEdit: boolean;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string;
  afterActions?: (row: T) => ReactNode;
}

export default function TableRow<T>({
  row,
  index,
  columns,
  selectable,
  isSelected,
  onToggle,
  actions,
  onEdit,
  onView,
  onDelete,
  canEdit,
  onRowClick,
  getRowClassName,
  afterActions,
}: TableRowProps<T>) {
  const [showOverflow, setShowOverflow] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showOverflow) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowOverflow(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showOverflow]);

  const visibleActions = actions.filter((a) => !a.show || a.show(row));
  const primaryActions = visibleActions.slice(0, 3);
  const overflowActions = visibleActions.slice(3);

  const hasActions = (canEdit && (!!onEdit || !!onDelete)) || !!onView || actions.length > 0;
  const extraClass = getRowClassName ? getRowClassName(row) : "";

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest("button") || (e.target as Element).closest("input")) return;
    if (onRowClick) onRowClick(row);
  };

  return (
    <tr
      className={cn(
        "group transition-colors duration-150 border-b border-border/40",
        index % 2 === 0 ? "bg-background/50" : "bg-muted/10",
        isSelected ? "bg-primary/5" : "hover:bg-primary/5",
        onRowClick && "cursor-pointer",
        showOverflow && "relative z-50",
        extraClass
      )}
      onClick={handleRowClick}
    >
      {selectable && (
        <td className="p-4 pl-6 w-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
        </td>
      )}
      {columns.map((col) => {
        const raw = getNestedValue(row, col.key);
        let displayVal: ReactNode;

        if (col.render) {
          displayVal = col.render(row, index);
        } else if (isDateField(col.key) && raw) {
          displayVal = formatDateValue(raw);
        } else {
          displayVal = String(formatDisplayValue(raw, col.key, col.header) ?? "");
        }

        return (
          <td
            key={col.key}
            className={cn(
              "p-4 first:pl-6 text-sm",
              col.hideOnMobile && "hidden sm:table-cell",
              alignClass[col.align ?? "left"]
            )}
          >
            {displayVal}
          </td>
        );
      })}
      {hasActions && (
        <td className="p-4 pr-6">
          <div className="flex items-center justify-end gap-1">
            {onView && (
              <ActionBtn
                icon="solar:eye-broken"
                label="View"
                onClick={(e) => { e.stopPropagation(); onView(row); }}
              />
            )}
            {canEdit && onEdit && (
              <ActionBtn
                icon="solar:pen-broken"
                label="Edit"
                onClick={(e) => { e.stopPropagation(); onEdit(row); }}
              />
            )}
            {primaryActions.map((action, ai) => {
              const icon = typeof action.icon === "function" ? action.icon(row) : action.icon;
              const lbl = typeof action.label === "function" ? action.label(row) : action.label;
              const disabled = action.disabled ? action.disabled(row) : false;
              return (
                <ActionBtn
                  key={ai}
                  icon={icon}
                  label={lbl}
                  variant={action.variant}
                  disabled={disabled}
                  onClick={(e) => { e.stopPropagation(); action.onClick(row); }}
                />
              );
            })}
            {overflowActions.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <ActionBtn
                  icon="solar:menu-dots-bold"
                  label="More actions"
                  onClick={(e) => { e.stopPropagation(); setShowOverflow((s) => !s); }}
                />
                {showOverflow && (
                  <div className="absolute right-0 top-9 z-[100] min-w-[180px] rounded-2xl shadow-2xl border border-border bg-card/95 backdrop-blur-xl p-1.5 overflow-hidden">
                    {overflowActions.map((action, ai) => {
                      const icon = typeof action.icon === "function" ? action.icon(row) : action.icon;
                      const lbl = typeof action.label === "function" ? action.label(row) : action.label;
                      const disabled = action.disabled ? action.disabled(row) : false;
                      return (
                        <button
                          key={ai}
                          disabled={disabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!disabled) action.onClick(row);
                            setShowOverflow(false);
                          }}
                          className={cn(
                            "flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium rounded-xl transition-all text-left",
                            disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-muted text-foreground",
                            action.variant === "danger" && !disabled && "text-destructive hover:bg-destructive/10"
                          )}
                        >
                          <Icon icon={icon} className="h-4 w-4 shrink-0" />
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {canEdit && onDelete && (
              <ActionBtn
                icon="solar:trash-bin-minimalistic-broken"
                label="Delete"
                variant="danger"
                onClick={(e) => { e.stopPropagation(); onDelete(row); }}
              />
            )}
            {afterActions?.(row)}
          </div>
        </td>
      )}
    </tr>
  );
}

function ActionBtn({
  icon,
  label,
  variant = "default",
  disabled = false,
  onClick,
}: {
  icon: string;
  label: string;
  variant?: "default" | "danger";
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-lg border transition-colors",
        variant === "danger"
          ? "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/15"
          : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <Icon icon={icon} className="h-3.5 w-3.5" />
    </button>
  );
}
