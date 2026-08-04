import { withPublicBasePath } from "./publicBasePath";

/** Full-page navigation — avoids Next.js client router stalls on static Firebase hosting. */
export function goToVenue(businessId: string, query?: Record<string, string | undefined>) {
  const id = String(businessId || "").trim();
  if (!id || id === "default") return;
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      const v = (value ?? "").trim();
      if (v) params.set(key, v);
    }
  }
  const qs = params.toString();
  window.location.href = withPublicBasePath(`/venue/${encodeURIComponent(id)}${qs ? `?${qs}` : ""}`);
}
