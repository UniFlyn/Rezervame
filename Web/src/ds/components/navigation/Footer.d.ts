import * as React from 'react';

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterColumn {
  title: string;
  links: Array<string | FooterLink>;
}

export interface FooterProps {
  logoSrc?: string;
  tagline?: string;
  columns?: FooterColumn[];
  socials?: Array<'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'x'>;
  socialItems?: Array<{ name: string; href?: string; label?: string }>;
  downloadTitle?: string;
  downloadSubtitle?: string;
  appStoreHref?: string;
  playStoreHref?: string;
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
