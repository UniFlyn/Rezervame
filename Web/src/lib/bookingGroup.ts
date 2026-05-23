/** Group key for multi-service reservations (same checkout / same visit day). */
export function appointmentDayKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "unknown";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function bookingGroupKey(booking: {
  bookingGroupId?: string | null;
  businessId?: string;
  date?: string | Date;
}): string {
  const gid = booking.bookingGroupId?.trim();
  if (gid) return `gid_${gid}`;
  const businessId = booking.businessId ?? "";
  const day = appointmentDayKey(booking.date ?? "");
  return `${businessId}_${day}`;
}

/** All bookings that belong to the same combined checkout / visit. */
export function bookingsInSameGroup<T extends {
  id?: string;
  bookingGroupId?: string | null;
  businessId?: string;
  date?: string | Date;
}>(seed: T, pool: T[]): T[] {
  const key = bookingGroupKey(seed);
  return pool.filter((b) => bookingGroupKey(b) === key);
}

export function formatBookingTimeRange(
  dates: Array<string | Date>,
  locale = "en-US",
): string {
  const parsed = dates
    .map((d) => (typeof d === "string" ? new Date(d) : d))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  if (parsed.length === 0) return "—";
  const fmt = (d: Date) =>
    d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  if (parsed.length === 1) return fmt(parsed[0]);
  return `${fmt(parsed[0])} – ${fmt(parsed[parsed.length - 1])}`;
}
