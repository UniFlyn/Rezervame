import * as React from 'react';
export interface MapCardProps {
  image?: string;
  name: string;
  rating?: number;
  /** Small uppercase coral eyebrow. */
  category?: string;
  /** e.g. "0.8 km" — shown before the address. */
  distance?: string;
  address?: string;
  ctaLabel?: string;
  onCta?: () => void;
  onClick?: () => void;
  width?: number;
  /** Compact tooltip format anchored to a map pin (smaller image/CTA). */
  compact?: boolean;
  style?: React.CSSProperties;
}
/**
 * Mini map preview card — floating business preview over a selected marker.
 * Image top · category eyebrow · name + rating (right) · distance·address · CTA.
 * @startingPoint section="Commerce" subtitle="Floating map preview card" viewport="320x340"
 */
export declare const MapCard: React.FC<MapCardProps>;
export default MapCard;
