import { apiGet } from "@/lib/api";

export type SiteStatus = {
  maintenanceMode: boolean;
  platformBranding?: string;
};

/** Public JSON on S3 (updated when Admin saves platform settings). */
export const DEFAULT_REMOTE_SITE_STATUS_URL =
  "https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com/uploads/platform/site-status.json";

async function fetchJsonStatus(url: string): Promise<SiteStatus | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return {
      maintenanceMode: data.maintenanceMode === true,
      platformBranding:
        typeof data.platformBranding === "string" ? data.platformBranding : undefined,
    };
  } catch {
    return null;
  }
}

/** Load visitor maintenance flag — API first, then payment-config, S3, then local static file. */
export async function fetchSiteStatus(): Promise<SiteStatus> {
  try {
    const data = await apiGet<SiteStatus>("/public/site/status");
    return {
      maintenanceMode: data?.maintenanceMode === true,
      platformBranding: data?.platformBranding,
    };
  } catch {
    // fall through
  }

  try {
    const pay = await apiGet<Record<string, unknown>>("/public/payment-config");
    if (typeof pay.maintenanceMode === "boolean") {
      return {
        maintenanceMode: pay.maintenanceMode === true,
        platformBranding:
          typeof pay.platformBranding === "string" ? pay.platformBranding : undefined,
      };
    }
  } catch {
    // fall through
  }

  const remote =
    process.env.NEXT_PUBLIC_SITE_STATUS_URL?.trim() || DEFAULT_REMOTE_SITE_STATUS_URL;
  const fromRemote = await fetchJsonStatus(remote);
  if (fromRemote) return fromRemote;

  // No API / S3 signal — default to live site (never use a baked-in static JSON).
  return { maintenanceMode: false };
}
