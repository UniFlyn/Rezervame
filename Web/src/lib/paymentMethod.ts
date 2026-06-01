export function isCashPaymentMethod(method?: string | null): boolean {
  if (!method || typeof method !== 'string') return false;
  const s = method.toLowerCase().trim();
  return (
    s.includes('cash') ||
    s.includes('at venue') ||
    s.includes('pay by visit') ||
    s.includes('pay at venue')
  );
}

export type CheckoutPayMethodId = 'wompi' | 'yappy' | 'pay_at_venue';

export function checkoutMethodToPaymentLabel(id: CheckoutPayMethodId): string {
  if (id === 'wompi') return 'Wompi';
  if (id === 'yappy') return 'Yappy';
  return 'Pay by visit';
}

/** Map legacy API method ids to checkout tab ids. */
export function normalizeCheckoutMethodId(id: string): CheckoutPayMethodId {
  if (id === 'wompi' || id === 'card') return 'wompi';
  if (id === 'yappy') return 'yappy';
  return 'pay_at_venue';
}

export function resolveBookingPaymentMethod(item: {
  paymentMethod?: string | null;
  transaction?: { paymentMethod?: string | null } | null;
}): string {
  const tx = item.transaction?.paymentMethod;
  const pref = item.paymentMethod;
  return String(tx || pref || '').trim();
}

export type BookingUiStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'paid'
  | 'rescheduled'
  | 'cash_at_venue';

export function mapBookingItemUiStatus(item: {
  status?: string | null;
  transactionId?: string | null;
  paymentMethod?: string | null;
  transaction?: { paymentMethod?: string | null } | null;
}): BookingUiStatus {
  const payMethod = resolveBookingPaymentMethod(item);
  const cash = isCashPaymentMethod(payMethod);
  const st = (item?.status || '').toLowerCase();

  if (st === 'completed') return 'completed';
  if (st === 'cancelled' || st === 'rejected') return 'cancelled';
  if (st === 'rescheduled') return 'rescheduled';
  if (st === 'paid') return 'paid';
  if (st === 'approved' || st === 'confirmed') {
    if (item?.transactionId) return 'paid';
    if (cash) return 'cash_at_venue';
    return 'confirmed';
  }
  return 'pending';
}

/** Cash selected at checkout but payment not yet confirmed by the business. */
export function isPayAtVenuePending(booking: {
  status?: string | null;
  paymentMethod?: string | null;
  transactionId?: string | null;
}): boolean {
  if (!isCashPaymentMethod(booking.paymentMethod)) return false;
  if (booking.transactionId) return false;
  const st = String(booking.status || '');
  return st === 'Approved' || st === 'Paid';
}

/** True when UI should show a digital "Paid" state (not pay-at-venue pending). */
export function bookingDisplaysAsPaid(booking: {
  status?: string | null;
  paymentMethod?: string | null;
  transactionId?: string | null;
}): boolean {
  if (isPayAtVenuePending(booking)) return false;
  return booking.status === 'Paid' || !!booking.transactionId;
}

export function aggregateGroupUiStatus(
  itemStatuses: BookingUiStatus[],
): BookingUiStatus {
  const active = itemStatuses.filter((s) => s !== 'cancelled');
  if (active.length === 0) return 'cancelled';
  if (active.every((s) => s === 'completed')) return 'completed';
  if (active.some((s) => s === 'pending')) return 'pending';
  if (active.some((s) => s === 'rescheduled')) return 'rescheduled';
  if (active.some((s) => s === 'cash_at_venue')) return 'cash_at_venue';
  if (active.every((s) => s === 'paid')) return 'paid';
  return 'confirmed';
}
