import * as React from 'react';
import { GlyphName } from '../core/Glyph';
import { SocialName } from '../core/SocialIcon';
export interface SocialLink { name?: SocialName; icon?: GlyphName; href?: string; }
export interface WeekHour { day: string; hours: string; }
export interface BusinessInfoPanelProps {
  name: string;
  mapImage?: string;
  /** Custom map node (e.g. an interactive map) rendered in the map slot instead of mapImage. */
  mapNode?: React.ReactNode;
  address?: string;
  about?: string;
  todayLabel?: string;
  todayHours?: string;
  /** Full weekly schedule; when provided, "Ver semana completa" expands/collapses it. */
  weekHours?: WeekHour[];
  phone?: string;
  email?: string;
  /** Social accounts — social network names (or { name, href }) shown under "Redes sociales". */
  socials?: (SocialName | SocialLink)[];
  links?: string[];
  /** Called when a footer link (e.g. payment policy, report) is clicked. */
  onLinkClick?: (label: string, index: number) => void;
  /** Called when the directions button is clicked (open Google Maps). */
  onDirections?: () => void;
  style?: React.CSSProperties;
}
/** Venue sidebar panel — map, about, hours, contact, socials and links. */
export declare const BusinessInfoPanel: React.FC<BusinessInfoPanelProps>;
export default BusinessInfoPanel;
