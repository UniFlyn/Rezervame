import * as React from 'react';
import { GlyphName } from '../core/Glyph';
export interface StaffStat { icon?: GlyphName; value: string | number; label: string; }
export interface StaffCardProps {
  photo?: string;
  name: string;
  role?: string;
  rating?: number;
  reviews?: number;
  stats?: StaffStat[];
  bio?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
  /** Denser layout: shorter portrait, tighter spacing — for multi-up grids. */
  compact?: boolean;
}
/** Professional/staff card with photo, rating, stat grid and bio. */
export declare const StaffCard: React.FC<StaffCardProps>;
export default StaffCard;
