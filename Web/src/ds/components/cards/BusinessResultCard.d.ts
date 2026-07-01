import * as React from 'react';
export interface BusinessResultCardProps {
  image?: string;
  name: string;
  rating?: number;
  reviews?: number;
  category?: string;
  location?: string;
  distance?: string;
  /** Short list of service names — first 2 shown as tags, the rest summarised as "+N". */
  services?: string[];
  hoursToday?: string;
  priceFrom?: number;
  priceTo?: number;
  /** OPTIONAL badge (e.g. "Nuevo", "Verificado", "Destacado"). */
  badge?: string;
  badgeTone?: 'coral' | 'navy' | 'success' | 'warning' | 'info' | 'neutral';
  favorite?: boolean;
  onFavorite?: () => void;
  onClick?: () => void;
  onReserve?: () => void;
  ctaLabel?: string;
  style?: React.CSSProperties;
}
/**
 * Business / venue GRID CARD for the SEARCH-RESULTS page — a denser, more
 * functional sibling of BusinessCard (Home). Rating chip overlaid on the image,
 * a single compact meta line, service tags, today's availability and an
 * isolated price + CTA footer. Fixed height so the grid lines up.
 * @startingPoint section="Cards" subtitle="Search-results grid card — compact, comparison-focused" viewport="280x318"
 */
export declare const BusinessResultCard: React.FC<BusinessResultCardProps>;
export default BusinessResultCard;
