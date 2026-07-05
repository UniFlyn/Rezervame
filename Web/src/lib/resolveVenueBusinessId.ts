import { PUBLIC_BASE_PATH } from "./publicBasePath";

function idFromPath(path: string): string {
  const escaped = PUBLIC_BASE_PATH.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}/venue/([^/]+)|^/venue/([^/]+)`);
  const m = path.match(re);
  const id = (m?.[1] || m?.[2] || "").trim();
  return id && id !== "default" ? id : "";
}

/** Resolve business id from the browser URL (Firebase static export serves venue/default.html for all ids). */
export function resolveVenueBusinessId(pathname: string | null, fallback = ""): string {
  if (typeof window !== "undefined") {
    const fromWindow = idFromPath(window.location.pathname);
    if (fromWindow) return fromWindow;
  }

  const fromPath = idFromPath(pathname || "");
  if (fromPath) return fromPath;

  const fb = (fallback || "").trim();
  if (fb && fb !== "default") return fb;
  return "";
}
