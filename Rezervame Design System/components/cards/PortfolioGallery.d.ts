import * as React from 'react';
export interface GalleryImage { src: string; alt?: string; }
export interface PortfolioGalleryProps {
  images: (GalleryImage | string)[];
  filters?: string[];
  activeFilter?: string;
  onFilter?: (filter: string) => void;
  columns?: number;
  gap?: number;
  style?: React.CSSProperties;
}
/** Masonry portfolio gallery with optional filter chips. */
export declare const PortfolioGallery: React.FC<PortfolioGalleryProps>;
export default PortfolioGallery;
