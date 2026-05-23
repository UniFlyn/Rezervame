/** Locale helpers for English / Spanish UI. */
export type AppLanguage = "en" | "es";

export function dateLocaleFor(language: AppLanguage): string {
  return language === "es" ? "es-PA" : "en-US";
}

export function pickLabel(
  row: { labelEn: string; labelEs?: string },
  language: AppLanguage = "en",
): string {
  if (language === "es") {
    return row.labelEs?.trim() || row.labelEn?.trim() || "";
  }
  return row.labelEn?.trim() || row.labelEs?.trim() || "";
}
