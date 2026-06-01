import { apiPost } from "@/lib/api";

type SiteStatusPayload = {
  maintenanceMode?: boolean;
  platformBranding?: string;
};

/** Publish visitor maintenance flag for Web/Mobile (S3 JSON + API when deployed). */
export async function publishVisitorSiteStatus(settings: SiteStatusPayload): Promise<void> {
  const payload = {
    maintenanceMode: settings.maintenanceMode === true,
    platformBranding: String(settings.platformBranding || "Rezervame").trim() || "Rezervame",
    updatedAt: new Date().toISOString(),
  };

  try {
    await apiPost("/admin/publish-site-status", {});
    return;
  } catch {
    // Older API — publish via storage upload with fixed key (requires API with fixedKey support).
  }

  try {
    const json = JSON.stringify(payload);
    const dataUrl = `data:application/json;base64,${btoa(unescape(encodeURIComponent(json)))}`;
    await apiPost<{ url: string }>("/storage/upload", {
      dataUrl,
      fixedKey: "site-status.json",
    });
  } catch {
    // Saved in DB; visitor flag syncs after API deploy or manual site-status.json on Web hosting.
  }
}
