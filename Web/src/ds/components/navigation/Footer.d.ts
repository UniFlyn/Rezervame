import * as React from 'react';
export interface FooterColumn { title: string; links: string[]; }
export interface FooterProps {
  logoSrc?: string;
  tagline?: string;
  columns?: FooterColumn[];
  socials?: ('facebook' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok')[];
  downloadTitle?: string;
  downloadSubtitle?: string;
  /** Inner content container width (CSS length). Default 'min(88%, 1400px)'. Pass a wider value (e.g. 'min(94vw, 1600px)') to align with widescreen page sections. */
  contentMax?: string;
  style?: React.CSSProperties;
}
/**
 * Coral brand footer with link columns, socials and app-store buttons.
 * @startingPoint section="Navigation" subtitle="Coral brand footer" viewport="1280x340"
 */
export declare const Footer: React.FC<FooterProps>;
export default Footer;
