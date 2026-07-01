import * as React from 'react';
export interface CategoryCardProps {
  image?: string;
  /** Category title — the ONLY text shown. */
  title: string;
  /** Compact, near-square. Default aspect '4 / 3'. Use '1 / 1' for square grids. */
  aspect?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/**
 * Image-led category / discovery tile — title only over a dark gradient.
 * Compact & near-square; for Home carousels and grids.
 * @startingPoint section="Cards" subtitle="Image category tile (title only)" viewport="220x165"
 */
export declare const CategoryCard: React.FC<CategoryCardProps>;
export default CategoryCard;
