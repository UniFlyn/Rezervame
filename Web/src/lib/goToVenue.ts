import { withPublicBasePath } from "./publicBasePath";

/** Full-page navigation — avoids Next.js client router stalls on static Firebase hosting. */
export function goToVenue(businessId: string) {
  const id = String(businessId || "").trim();
  if (!id) return;
  window.location.href = withPublicBasePath(`/venue/${id}`);
}
