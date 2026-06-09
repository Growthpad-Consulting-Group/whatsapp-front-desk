"use client";

import { useState, useMemo, useEffect } from "react";

export interface UseTableOptions<T = any> {
  onSelectionChange?: (selected: string[]) => void;
  customFilter?: (row: T, searchTerm: string) => boolean;
}

export interface UseTableReturn<T = any> {
  paged: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  filteredData: T[];
  sortKey: string | null;
  sortDir: "asc" | "desc";
  selected: string[];
  searchTerm: string;
  statusFilter: string;
  sortBy: string;
  isMobile: boolean;
  isTablet: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  handleSort: (key: string) => void;
  handlePage: (newPage: number) => void;
  toggleSelect: (id: string) => void;
  selectAll: (allIds: string[]) => void;
  clearSelection: () => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setSortBy: (sort: string) => void;
}

export function useTable<T>(
  data: T[],
  initialPageSize = 20,
  statusOptions: string[] | Array<{ value: string; label: string }> | null = null,
  options: UseTableOptions<T> = {}
): UseTableReturn<T> {
  const { onSelectionChange, customFilter } = options;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(initialPageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTermRaw, setSearchTermRaw] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsMobile(w < 640);
      setIsTablet(w >= 640 && w < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const setSearchTerm = (term: string) => {
    setSearchTermRaw(term);
    setPage(1);
  };

  const setPageSize = (size: number) => {
    setPageSizeRaw(size);
    setPage(1);
  };

  const searchTermLower = useMemo(() => searchTermRaw.toLowerCase(), [searchTermRaw]);

  const filteredData = useMemo(() => {
    if (!data.length) return [];
    let result = data as Array<Record<string, any>>;

    // Custom filter
    if (typeof customFilter === "function") {
      result = result.filter((row) => customFilter(row as T, searchTermRaw));
    }

    // Status filter
    if (statusFilter !== "all" && statusOptions) {
      result = result.filter((row) => {
        const sv = String(row.status ?? row.approval_status ?? row.payment_status ?? "").toLowerCase();
        return sv === statusFilter.toLowerCase();
      });
    }

    // Deep search
    if (searchTermLower) {
      const searchableFields = [
        "name", "title", "description", "email", "phone",
        "id", "invoice_number", "status", "body", "type",
      ];

      const deepMatch = (obj: any, term: string, depth = 0): boolean => {
        if (depth > 3 || !obj) return false;
        if (typeof obj === "string") return obj.toLowerCase().includes(term);
        if (typeof obj === "number") return String(obj).includes(term);
        if (Array.isArray(obj)) return obj.some((v) => deepMatch(v, term, depth + 1));
        if (typeof obj === "object") return Object.values(obj).some((v) => deepMatch(v, term, depth + 1));
        return false;
      };

      result = result.filter((row) => {
        // Quick check on common fields first
        for (const f of searchableFields) {
          if (row[f] !== undefined && row[f] !== null) {
            if (String(row[f]).toLowerCase().includes(searchTermLower)) return true;
          }
        }
        return deepMatch(row, searchTermLower);
      });
    }

    // Global sortBy
    if (sortBy === "recent") {
      result = [...result].sort((a, b) => {
        const ad = a.created_at ?? a.start_at ?? a.updated_at;
        const bd = b.created_at ?? b.start_at ?? b.updated_at;
        if (!ad && !bd) return 0;
        if (!ad) return 1;
        if (!bd) return -1;
        return new Date(bd).getTime() - new Date(ad).getTime();
      });
    } else if (sortBy === "asc") {
      result = [...result].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    } else if (sortBy === "desc") {
      result = [...result].sort((a, b) => (b.name ?? "").localeCompare(a.name ?? ""));
    }

    // Column sort
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const getVal = (obj: any, key: string): any =>
          key.split(".").reduce((acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined), obj);
        let av = getVal(a, sortKey) ?? "";
        let bv = getVal(b, sortKey) ?? "";
        if (typeof av === "number" && typeof bv === "number") {
          return sortDir === "asc" ? av - bv : bv - av;
        }
        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();
        const cmp = av.localeCompare(bv);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result as unknown as T[];
  }, [data, searchTermLower, statusFilter, sortBy, sortKey, sortDir, customFilter, statusOptions, searchTermRaw]);

  const totalItems = filteredData.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const paged = pageSize === -1 ? filteredData : filteredData.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handlePage = (newPage: number) => {
    setPage(Math.max(1, Math.min(totalPages, newPage)));
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectAll = (allIds: string[]) => {
    const allSelected = allIds.every((id) => selected.includes(id));
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelected((prev) => [...prev, ...allIds.filter((id) => !prev.includes(id))]);
    }
  };

  const clearSelection = () => setSelected([]);

  useEffect(() => {
    onSelectionChange?.(selected);
  }, [selected, onSelectionChange]);

  return {
    paged,
    page,
    pageSize,
    totalPages,
    totalItems,
    filteredData,
    sortKey,
    sortDir,
    selected,
    searchTerm: searchTermRaw,
    statusFilter,
    sortBy,
    isMobile,
    isTablet,
    setPage,
    setPageSize,
    handleSort,
    handlePage,
    toggleSelect,
    selectAll,
    clearSelection,
    setSearchTerm,
    setStatusFilter,
    setSortBy,
  };
}

export default useTable;
