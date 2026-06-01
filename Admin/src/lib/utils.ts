import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** 6-digit display for business.merchantNumber (100000–999999). */
export function formatMerchantNumericId(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return String(n).padStart(6, "0");
}

type WorkingHoursRow = { day: string; hours: string };

function workingHoursLabel(row: Record<string, unknown>): string {
  if (row.hours !== undefined && row.hours !== null) {
    const h = String(row.hours).trim();
    return h || "Closed";
  }
  if (row.open === false) return "Closed";
  const start = String(row.start ?? "").trim();
  const end = String(row.end ?? "").trim();
  if (start && end) return `${start} - ${end}`;
  return "Closed";
}

/** Parse stored working-hours JSON (or plain text) for admin display. */
export function parseWorkingHours(value: unknown): WorkingHoursRow[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const day = String(row.day ?? "").trim();
        if (!day) return null;
        return { day, hours: workingHoursLabel(row) };
      })
      .filter((row): row is WorkingHoursRow => row !== null);
  }
  if (typeof value !== "string" || !value.trim()) return [];
  const trimmed = value.trim();
  if (!trimmed.startsWith("[")) {
    return [{ day: "Hours", hours: trimmed }];
  }
  try {
    const parsed = JSON.parse(trimmed);
    return parseWorkingHours(parsed);
  } catch {
    return [{ day: "Hours", hours: trimmed }];
  }
}
