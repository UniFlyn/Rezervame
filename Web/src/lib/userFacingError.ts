/** Strip API URLs, env paths, and dev hints from errors shown in the UI. */
export function userFacingError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!(err instanceof Error)) return fallback;
  let msg = err.message || fallback;
  msg = msg.replace(/https?:\/\/[^\s]+/gi, "");
  msg = msg.replace(/NEXT_PUBLIC_[A-Z_]+/g, "");
  msg = msg.replace(/\.env\.local/gi, "");
  msg = msg.replace(/port\s*4000/gi, "");
  msg = msg.replace(/Is the API running at\s*\??/gi, "");
  msg = msg.replace(/Check\s+\/[^\s]+/gi, "");
  msg = msg.replace(/Failed to reach venues API/i, "Unable to load venues right now.");
  msg = msg.replace(/Venues request timed out[^.]*/i, "This is taking longer than usual. Please try again.");
  msg = msg.replace(/Request timed out[^.]*/i, "This is taking longer than usual. Please try again.");
  msg = msg.replace(/\s{2,}/g, " ").trim();
  return msg.length > 4 ? msg : fallback;
}
