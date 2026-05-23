/** Pending booking confirmation shown after checkout (incl. Stripe return). */
export type BookingConfirmationPayload = {
  date: string;
  venue?: string;
  service: string;
  professional: string;
  bookingFor: string;
  price: string;
  bookingId?: string;
  auto?: boolean;
  cash?: boolean;
  paid?: boolean;
};

const STORAGE_KEY = "rezervame_booking_confirmation";

export function saveBookingConfirmation(payload: BookingConfirmationPayload): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function loadBookingConfirmation(): BookingConfirmationPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookingConfirmationPayload;
  } catch {
    return null;
  }
}

export function clearBookingConfirmation(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function navigateToBookingConfirmation(
  payload: BookingConfirmationPayload,
): void {
  if (typeof window === "undefined") return;
  saveBookingConfirmation(payload);
  const sp = bookingConfirmationToSearchParams(payload);
  window.location.assign(`/reservations/confirmation?${sp.toString()}`);
}

export function bookingConfirmationToSearchParams(
  payload: BookingConfirmationPayload,
): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set("date", payload.date);
  if (payload.venue) sp.set("venue", payload.venue);
  sp.set("service", payload.service);
  sp.set("professional", payload.professional);
  sp.set("bookingFor", payload.bookingFor);
  sp.set("price", payload.price);
  if (payload.bookingId) sp.set("bookingId", payload.bookingId);
  if (payload.auto) sp.set("auto", "1");
  if (payload.cash) sp.set("cash", "1");
  if (payload.paid) sp.set("paid", "1");
  return sp;
}

export function isBookingConfirmationPath(pathname: string): boolean {
  return pathname === "/reservations/confirmation";
}
