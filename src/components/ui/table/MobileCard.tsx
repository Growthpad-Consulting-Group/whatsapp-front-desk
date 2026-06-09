"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { getNestedValue, isDateField, formatDateValue, formatDisplayValue } from "./TableUtils";
import type { TableColumn, RowAction } from "../GenericTable";

interface MobileCardProps<T> {
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
}

export default function MobileCard<T>({
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
}: MobileCardProps<T>) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  const visibleCols = columns.filter((c) => !c.hideOnMobile);
  const primaryCols = visibleCols.slice(0, 2);
  const secondaryCols = visibleCols.slice(2);

  const visibleActions = actions.filter((a) => !a.show || a.show(row));
  const extraClass = getRowClassName ? getRowClassName(row) : "";

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest("button") || (e.target as Element).closest("input")) return;
    if (onRowClick) onRowClick(row);
  };

  const renderValue = (col: TableColumn<T>) => {
    const raw = getNestedValue(row, col.key);
    if (col.render) return col.render(row, index);
    if (isDateField(col.key) && raw) return formatDateValue(raw);
    return String(formatDisplayValue(raw, col.key, col.header) ?? "");
  };

  return (
    <div
      className={cn(
        "px-5 py-4 border-b border-border/40 transition-colors duration-150",
        index % 2 === 0 ? "bg-background/50" : "bg-muted/10",
        isSelected ? "bg-primary/5" : "hover:bg-primary/5",
        onRowClick && "cursor-pointer",
        extraClass
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: checkbox + content */}
        <div className="flex items-start gap-3 flex-1 overflow-hidden">
          {selectable && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggle}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0"
            />
          )}
          <div className="flex-1 space-y-2 overflow-hidden">
            {/* Primary fields */}
            {primaryCols.map((col) => (
              <div key={col.key} className="min-w-0">
                <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block mb-0.5">
                  {col.header}
                </span>
                <div className="text-sm font-bold text-foreground truncate">
                  {renderValue(col)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-start gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onView && (
            <ActionBtn icon="solar:eye-broken" label="View" onClick={() => onView(row)} />
          )}
          {canEdit && onEdit && (
            <ActionBtn icon="solar:pen-broken" label="Edit" onClick={() => onEdit(row)} />
          )}
          {visibleActions.length <= 2 ? (
            visibleActions.map((action, ai) => {
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
                  onClick={() => action.onClick(row)}
                />
              );
            })
          ) : (
            <div className="relative" ref={dropdownRef}>
              <ActionBtn
                icon="solar:menu-dots-bold"
                label="More"
                onClick={() => setShowDropdown((s) => !s)}
              />
              {showDropdown && (
                <div className="absolute right-0 top-9 z-[100] min-w-[180px] rounded-2xl shadow-2xl border border-border bg-card/95 backdrop-blur-xl p-1.5 overflow-hidden">
                  {visibleActions.map((action, ai) => {
                    const icon = typeof action.icon === "function" ? action.icon(row) : action.icon;
                    const lbl = typeof action.label === "function" ? action.label(row) : action.label;
                    const disabled = action.disabled ? action.disabled(row) : false;
                    return (
                      <button
                        key={ai}
                        disabled={disabled}
                        onClick={() => {
                          if (!disabled) action.onClick(row);
                          setShowDropdown(false);
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
              onClick={() => onDelete(row)}
            />
          )}
        </div>
      </div>

      {/* Secondary fields */}
      {secondaryCols.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 pl-7">
          {secondaryCols.map((col) => (
            <div key={col.key} className="min-w-0">
              <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block mb-0.5">
                {col.header}
              </span>
              <div className="text-xs font-semibold text-foreground/80 truncate">
                {renderValue(col)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
  onClick: () => void;
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
