import * as React from 'react';
import { GlyphName } from './Glyph';
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Glyph name (preferred) or a custom ReactNode. */
  icon: GlyphName | React.ReactNode;
  /**
   * neutral (default, transparent + navy icon) · outline (coral border, fills
   * coral on hover) · filled (coral) · dark (navy) · soft (gray fill) ·
   * outlineNeutral (neutral border) · ghost.
   */
  variant?: 'neutral' | 'outline' | 'filled' | 'dark' | 'soft' | 'outlineNeutral' | 'ghost';
  /** sm 32 · md 40 (default) · lg 48 — icon scales 16/18/22, optically centered. */
  size?: 'sm' | 'md' | 'lg';
  /** Circle (999px) — use for favorite, share, notify, location, download, settings. */
  round?: boolean;
  /** Active/selected: coral fill + white icon, any variant. */
  selected?: boolean;
  /** Small coral dot, top-right corner. */
  badge?: boolean;
  /** Numeric badge (e.g. unread count) — coral pill, top-right. */
  badgeCount?: number;
  disabled?: boolean;
  /** Accessible action label (Favorite, Share, Notifications, Download, …). Required for handoff. */
  label?: string;
}
/**
 * Square or circular icon-only button — header actions, quick actions, table
 * rows, social circles. Standardized container/icon sizes, one outline icon
 * style (1.75 stroke), full state matrix, corner badge that never crops the icon.
 * @startingPoint section="Core" subtitle="Icon buttons — sizes, states, badge" viewport="700x150"
 */
export declare const IconButton: React.FC<IconButtonProps>;
export default IconButton;
