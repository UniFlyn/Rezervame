import * as React from 'react';
export interface BusinessListItemProps {
  image?: string;
  name: string;
  rating?: number;
  reviews?: number;
  category?: string;
  location?: string;
  distance?: string;
  /** Short list of service names — first 3 shown as tags, the rest summarised as "+N". */
  services?: string[];
  hoursToday?: string;
  priceFrom?: number;
  priceTo?: number;
  /** OPTIONAL badge (e.g. "Nuevo", "Verificado"). */
  badge?: string;
  badgeTone?: 'coral' | 'navy' | 'success' | 'warning' | 'info' | 'neutral';
  favorite?: boolean;
  onFavorite?: () => void;
  onClick?: () => void;
  onReserve?: () => void;
  ctaLabel?: string;
  /** Highlights the row (coral border + lift) when its map marker is selected. */
  active?: boolean;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
/**
 * Business / venue LIST ROW — horizontal counterpart of BusinessCard for the
 * search-results / business-listing page. Image left, info middle, price + CTA
 * right. `active` links it to a selected map marker.
 * @startingPoint section="Cards" subtitle="Venue list row — image left, price + CTA right" viewport="720x190"
 */
export declare const BusinessListItem: React.FC<BusinessListItemProps>;
export default BusinessListItem;
