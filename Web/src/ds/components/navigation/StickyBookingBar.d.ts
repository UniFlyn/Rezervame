import * as React from 'react';
export interface StickyBookingBarProps {
  /** Business name (navy, left). */
  name: string;
  /** Location / short address under the name (hidden on narrow screens). */
  location?: string;
  /** Avatar/logo image; pass to show the leading avatar (omit to hide it). */
  avatar?: string;
  ctaLabel?: string;
  onReserve?: () => void;
  /** Controlled visibility. Omit to auto-show on scroll (see watchRef). */
  visible?: boolean;
  /** Ref to the on-page business header; bar appears once it scrolls off-screen. */
  watchRef?: React.RefObject<HTMLElement>;
  /** Render in normal flow (for cards/previews) instead of position:fixed. */
  static?: boolean;
  style?: React.CSSProperties;
}
/**
 * Booksy-style venue sticky booking bar — hidden at top, slides down on scroll
 * with the business name, location and a coral "Reservar Ahora" CTA.
 * @startingPoint section="Navigation" subtitle="Venue sticky booking bar" viewport="1280x70"
 */
export declare const StickyBookingBar: React.FC<StickyBookingBarProps>;
export default StickyBookingBar;
