/**
 * Shared react-select style factory.
 * Pass mode="light"|"dark" to get appropriate styles.
 */
export function getSelectStyles(mode: "light" | "dark" = "light") {
  const isDark = mode === "dark";

  return {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
      borderColor: state.isFocused
        ? "#16a34a"
        : isDark
        ? "#334155"
        : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(22,163,74,0.2)" : "none",
      borderRadius: "0.75rem",
      minHeight: "40px",
      "&:hover": { borderColor: "#16a34a" },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
      border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
      borderRadius: "0.75rem",
      boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
      zIndex: 9999,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#16a34a"
        : state.isFocused
        ? isDark
          ? "#334155"
          : "#f0fdf4"
        : "transparent",
      color: state.isSelected ? "#ffffff" : isDark ? "#f8fafc" : "#0f172a",
      fontSize: "0.875rem",
      cursor: "pointer",
      "&:active": { backgroundColor: "#15803d" },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDark ? "#f8fafc" : "#0f172a",
      fontSize: "0.875rem",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: isDark ? "#64748b" : "#94a3b8",
      fontSize: "0.875rem",
    }),
    input: (base: any) => ({
      ...base,
      color: isDark ? "#f8fafc" : "#0f172a",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: isDark ? "#64748b" : "#94a3b8",
      "&:hover": { color: "#16a34a" },
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: isDark ? "#334155" : "#f0fdf4",
      borderRadius: "0.5rem",
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: isDark ? "#f8fafc" : "#15803d",
      fontSize: "0.75rem",
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: isDark ? "#94a3b8" : "#64748b",
      borderRadius: "0 0.5rem 0.5rem 0",
      "&:hover": { backgroundColor: "#fecaca", color: "#dc2626" },
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  };
}
