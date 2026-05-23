/** Full-page navigation — avoids Next.js client router stalls on some routes. */
export function goToVenue(businessId: string) {
  const id = String(businessId || "").trim();
  if (!id) return;
  window.location.href = `/venue/${id}`;
}
