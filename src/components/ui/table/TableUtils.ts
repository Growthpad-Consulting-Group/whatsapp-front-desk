// ─── Table Utilities ──────────────────────────────────────────────────────────

export function getNestedValue(obj: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (acc, k) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[k]
          : undefined,
      obj
    );
}

const DATE_FIELDS = [
  "created_at", "updated_at", "deleted_at", "timestamp",
  "date", "start_at", "end_at", "due_date", "start_date", "end_date",
];

export function isDateField(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    DATE_FIELDS.includes(lower) ||
    lower.includes("_at") ||
    lower.includes("date") ||
    lower.includes("time")
  );
}

export function formatDateValue(value: unknown): string {
  if (!value) return String(value ?? "");
  try {
    const d = new Date(String(value));
    if (isNaN(d.getTime())) return String(value);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return String(value);
  }
}

const CURRENCY_PATTERNS = [
  "price", "cost", "amount", "total", "value", "revenue", "profit",
  "fee", "charge", "payment", "balance", "credit", "debit", "refund",
  "discount", "tax", "subtotal", "outstanding",
];

const NO_FORMAT_PATTERNS = [
  "sku", "barcode", "code", "id", "reference", "serial", "number",
];

export function formatDisplayValue(value: unknown, accessor?: string, header?: string): unknown {
  if (value === null || value === undefined || value === "") return value;

  const acc = (accessor ?? "").toLowerCase();
  const hdr = (header ?? "").toLowerCase();

  const noFormat = NO_FORMAT_PATTERNS.some((p) => acc.includes(p) || hdr.includes(p));
  if (noFormat) return value;

  const isCurrency = CURRENCY_PATTERNS.some((p) => acc.includes(p) || hdr.includes(p));
  const num = parseFloat(String(value));

  if (isCurrency && !isNaN(num)) {
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (!isNaN(num) && num >= 1000) {
    return num.toLocaleString();
  }

  return value;
}
