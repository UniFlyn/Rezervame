const NETWORK_FALLBACK =
  "We couldn't reach our servers. Check your internet connection and try again.";

/** Strip API URLs, env paths, and dev hints from errors shown in the UI. */
export function userFacingError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (typeof err === "string" && err.trim()) {
    return sanitizeUserMessage(err.trim(), fallback);
  }
  if (!(err instanceof Error)) return fallback;
  const raw = err.message || fallback;
  return sanitizeUserMessage(raw, fallback);
}

function sanitizeUserMessage(msg: string, fallback: string): string {
  let out = msg;
  if (/^failed to fetch$/i.test(out.trim()) || /networkerror/i.test(out)) {
    return NETWORK_FALLBACK;
  }
  out = out.replace(/https?:\/\/[^\s]+/gi, "");
  out = out.replace(/NEXT_PUBLIC_[A-Z_]+/g, "");
  out = out.replace(/\.env\.local/gi, "");
  out = out.replace(/port\s*4000/gi, "");
  out = out.replace(/Is the API running at\s*\??/gi, "");
  out = out.replace(/Check\s+\/[^\s]+/gi, "");
  out = out.replace(/Failed to reach venues API/i, "Unable to load venues right now.");
  out = out.replace(/Failed to fetch/i, NETWORK_FALLBACK);
  out = out.replace(/Load failed/i, "Unable to load this content right now.");
  out = out.replace(/Venues request timed out[^.]*/i, "This is taking longer than usual. Please try again.");
  out = out.replace(/Request timed out[^.]*/i, "This is taking longer than usual. Please try again.");
  out = out.replace(/\s{2,}/g, " ").trim();
  return out.length > 4 ? out : fallback;
}
