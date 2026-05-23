import en from "../../../shared/locales/en.json";
import es from "../../../shared/locales/es.json";
import type { Language } from "@/components/I18nProvider";

export type ReservationUiStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'paid'
  | 'rescheduled'
  | 'cash_at_venue';

const STATUS_KEYS: Record<ReservationUiStatus, keyof typeof en> = {
  pending: 'resPending',
  confirmed: 'resAwaitingPayment',
  paid: 'resPaid',
  cash_at_venue: 'resPayAtVenue',
  completed: 'resCompleted',
  rescheduled: 'resRescheduled',
  cancelled: 'resCancelled',
};

export function reservationStatusLabel(
  status: ReservationUiStatus,
  language: Language = 'en',
): string {
  const catalog: Record<string, string> = language === "es" ? es : en;
  const key = STATUS_KEYS[status];
  return catalog[key] || status;
}

export function reservationStatusBadgeClass(status: ReservationUiStatus): string {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    case 'paid':
      return 'bg-cyan-50 text-cyan-600 border border-cyan-100';
    case 'cash_at_venue':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'completed':
      return 'bg-blue-50 text-blue-600 border border-blue-100';
    case 'rescheduled':
    case 'pending':
      return 'bg-amber-50 text-amber-600 border border-amber-100';
    case 'cancelled':
      return 'bg-red-50 text-red-500 border border-red-100';
    default:
      return 'bg-slate-50 text-slate-600 border border-slate-100';
  }
}
