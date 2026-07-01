import * as React from 'react';
export interface BookingConfirmationProps {
  open?: boolean;
  business?: string;
  /** One or more booked services — joined as "A + B". */
  services?: (string | { name: string })[];
  datetime?: string;
  location?: string;
  /** Assigned professional names — shown under the services and in calendar events. */
  professionals?: string[];
  /** ISO start/end timestamps — enable real Google/Outlook/iCal events. */
  startISO?: string;
  endISO?: string;
  /** Reservation-detail link used by "Compartir" / "Copiar enlace" and calendar events. */
  reservationUrl?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onClose?: () => void;
  footerLinks?: boolean;
  brandLine?: string;
  style?: React.CSSProperties;
}
/**
 * Booking confirmation modal — complete, centered, premium card that NEVER
 * scrolls internally (content sized with clamp(); backdrop scrolls if needed).
 * Success icon, "Reserva exitosa", business, service(s), date/time, location, CTAs.
 * @startingPoint section="Booking" subtitle="No-scroll booking confirmation" viewport="600x620"
 */
export declare const BookingConfirmation: React.FC<BookingConfirmationProps>;
export default BookingConfirmation;
