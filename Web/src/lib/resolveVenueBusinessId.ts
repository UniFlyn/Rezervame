import { PUBLIC_BASE_PATH } from "./publicBasePath";

/** Extract venue business id from any path shape (/new/venue/id, /venue/id). */
function idFromPath(path: string): string {
  const m = path.match(/\/venue\/([^/?#]+)/i);
  const id = (m?.[1] || "").trim();
  return id && id !== "default" ? decodeURIComponent(id) : "";
}

function idFromSearch(search: string): string {
  if (!search) return "";
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const id = (params.get("businessId") || params.get("id") || "").trim();
    return id && id !== "default" ? id : "";
  } catch {
    return "";
  }
}

/** Resolve business id from the browser URL (Firebase static export serves venue/default.html for all ids). */
export function resolveVenueBusinessId(
  pathname: string | null,
  fallback = "",
  search: string | null = null,
): string {
  if (typeof window !== "undefined") {
    const fromWindowPath = idFromPath(window.location.pathname);
    if (fromWindowPath) return fromWindowPath;
    const fromWindowSearch = idFromSearch(window.location.search);
    if (fromWindowSearch) return fromWindowSearch;
  }

  const fromPath = idFromPath(pathname || "");
  if (fromPath) return fromPath;

  const fromSearch = idFromSearch(search || "");
  if (fromSearch) return fromSearch;

  const fb = (fallback || "").trim();
  if (fb && fb !== "default") return fb;

  // Legacy: explicit base-path prefix when pathname omits it.
  if (PUBLIC_BASE_PATH && pathname) {
    const prefixed = idFromPath(`${PUBLIC_BASE_PATH}${pathname.startsWith("/") ? "" : "/"}${pathname}`);
    if (prefixed) return prefixed;
  }

  return "";
}
