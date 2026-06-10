import type { StylesConfig } from "react-select";

export function getSelectStyles<T>(mode: string = "light"): StylesConfig<T, false> {
  const isDark = mode === "dark";

  const bg          = isDark ? "#0f172a" : "#ffffff";
  const border      = isDark ? "#1e293b" : "#e2e8f0";
  const text        = isDark ? "#f8fafc" : "#0f172a";
  const muted       = isDark ? "#94a3b8" : "#64748b";
  const hoverBorder = isDark ? "#334155" : "#4272ff";
  const primary     = isDark ? "#3b82f6" : "#4272ff";
  const optionHover = isDark ? "#1e293b" : "#eff6ff";

  return {
    control: (provided, state) => ({
      ...provided,
      minHeight: "40px",
      fontSize: "14px",
      backgroundColor: bg,
      borderColor: state.isFocused ? primary : border,
      borderWidth: "1px",
      borderRadius: "0.75rem",
      boxShadow: state.isFocused ? `0 0 0 2px ${primary}33` : "none",
      "&:hover": { borderColor: hoverBorder },
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
      padding: "8px 12px",
      backgroundColor: state.isSelected ? primary : state.isFocused ? optionHover : bg,
      color: state.isSelected ? "#ffffff" : text,
      "&:active": { backgroundColor: isDark ? "#334155" : "#dbeafe" },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      backgroundColor: bg,
      border: `1px solid ${border}`,
      borderRadius: "0.75rem",
      boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    }),
    menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
    placeholder: (provided) => ({ ...provided, color: muted, fontSize: "14px" }),
    singleValue: (provided) => ({ ...provided, color: text, fontSize: "14px" }),
    input: (provided) => ({ ...provided, color: text, fontSize: "14px" }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: muted,
      "&:hover": { color: isDark ? text : primary },
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: muted,
      "&:hover": { color: isDark ? text : primary },
    }),
    indicatorSeparator: () => ({ display: "none" }),
    noOptionsMessage: (provided) => ({ ...provided, color: muted, fontSize: "14px" }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: isDark ? "#1e293b" : "#e2e8f0",
    }),
    multiValueLabel: (provided) => ({ ...provided, color: text }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: muted,
      "&:hover": { backgroundColor: primary, color: "#ffffff" },
    }),
  };
}

export default getSelectStyles;
