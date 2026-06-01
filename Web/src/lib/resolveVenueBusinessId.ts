/** Resolve business id from the browser URL (Firebase static export serves /venue/default.html for all ids). */
export function resolveVenueBusinessId(pathname: string | null, fallback = ""): string {
  const fromPath = (pathname || "").match(/^\/venue\/([^/]+)/)?.[1]?.trim() || "";
  if (fromPath && fromPath !== "default") return fromPath;
  const fb = (fallback || "").trim();
  if (fb && fb !== "default") return fb;
  return "";
}
