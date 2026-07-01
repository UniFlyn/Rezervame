import * as React from 'react';
export interface RatingProps {
  value: number;
  count?: number;
  max?: number;
  size?: number;
  /** 'inline' = 4.9 ★★★★★ (287 reseñas); 'compact' = ★ 4.9 (128). */
  layout?: 'inline' | 'compact';
  showValue?: boolean;
  style?: React.CSSProperties;
}
/** Gold star rating with value + review count. */
export declare const Rating: React.FC<RatingProps>;
export default Rating;
