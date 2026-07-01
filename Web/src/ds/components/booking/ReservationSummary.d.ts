import * as React from 'react';
export interface ReservationService { name: string; price: number | string; duration?: string; professional?: string; time?: string; /** Recipient name (omit for the account owner). */ for?: string; /** Force the "Para: Ti" recipient line. */ recipientSelf?: boolean; }
export interface ReservationSummaryProps {
  /** Booked services as removable line items — supports multiple. */
  services?: ReservationService[];
  professional?: string;
  date?: string;
  time?: string;
  currency?: string;
  eyebrow?: string;
  confirmLabel?: string;
  addLabel?: string;
  note?: string;
  /** Show the "add another service" action. */
  onAddService?: () => void;
  onRemoveService?: (s: ReservationService, i: number) => void;
  onConfirm?: () => void;
  style?: React.CSSProperties;
}
/**
 * Reservation builder / summary panel — multiple service line items, add/remove,
 * professional·date·time, computed total and the Confirmar reserva CTA.
 * @startingPoint section="Booking" subtitle="Reservation summary (multi-service)" viewport="340x520"
 */
export declare const ReservationSummary: React.FC<ReservationSummaryProps>;
export default ReservationSummary;
