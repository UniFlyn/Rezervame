import * as React from 'react';
export interface PortfolioTileProps {
  src: string;
  alt?: string;
  /** Optional CSS aspect-ratio (e.g. '1 / 1', '3 / 4'). Omit to keep the image's natural ratio for true masonry. */
  aspect?: string;
  /** Corner radius (CSS). Default --radius-md. */
  rounded?: string;
  /** Open lightbox / gallery. */
  onClick?: () => void;
  style?: React.CSSProperties;
}
/**
 * Image-first portfolio tile for masonry/grid galleries — minimal, rounded,
 * hover zoom + shadow, click to open a lightbox.
 * @startingPoint section="Cards" subtitle="Masonry portfolio image tile" viewport="240x300"
 */
export declare const PortfolioTile: React.FC<PortfolioTileProps>;
export default PortfolioTile;
