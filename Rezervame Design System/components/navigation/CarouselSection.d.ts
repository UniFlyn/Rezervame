import * as React from 'react';
export interface CarouselSectionProps {
  /** Section title (left). */
  title: string;
  /** Optional uppercase eyebrow above the title (left mode). */
  subtitle?: string;
  /** left = title left + link right (default); center = title + subtitle centered, no link (category header). */
  align?: 'left' | 'center';
  /** Right-aligned link label. Default "Ver todos los negocios". */
  linkLabel?: string;
  /** Show the link + wire its click. Omit to hide the link entirely. */
  onLink?: () => void;
  /** Fixed width per card/slide (px). Default 280. */
  cardWidth?: number;
  gap?: number;
  /** Show circular prev/next arrows when the row overflows. Default true. */
  arrows?: boolean;
  /** Cards — each wrapped as a fixed-width, scroll-snapping slide. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
/**
 * Fresha-style Home section: title left, "Ver todos →" right, horizontal
 * swipeable card carousel below with circular overflow arrows. Page scrolls
 * vertically; the row scrolls horizontally. Not a tab/filter.
 * @startingPoint section="Navigation" subtitle="Home carousel section row" viewport="900x340"
 */
export declare const CarouselSection: React.FC<CarouselSectionProps>;
export default CarouselSection;
