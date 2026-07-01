import * as React from 'react';
export interface BusinessCardProps {
  image?: string;
  name: string;
  rating?: number;
  reviews?: number;
  category?: string;
  location?: string;
  /** OPTIONAL badge (e.g. "Nuevo", "Verificado", "Recomendado"). Omit by default — section titles carry context. */
  badge?: string;
  badgeTone?: 'coral' | 'navy' | 'success' | 'warning' | 'info' | 'neutral';
  favorite?: boolean;
  onFavorite?: () => void;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/**
 * Business / venue card — compact, image on top, essential info below
 * (name, category · location, rating + reviews). Favourite heart overlaid.
 * @startingPoint section="Cards" subtitle="Venue card — compact, info below" viewport="300x320"
 */
export declare const BusinessCard: React.FC<BusinessCardProps>;
export default BusinessCard;
