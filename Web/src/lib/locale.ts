/** English-only locale helpers (Spanish support removed). */
export const DATE_LOCALE = "en-US" as const;

export function pickLabel(row: { labelEn: string; labelEs?: string }): string {
  return row.labelEn?.trim() || row.labelEs?.trim() || "";
}
