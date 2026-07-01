import * as React from 'react';
import { GlyphName } from '../core/Glyph';
export interface NotificationItemProps {
  /** compact = header bell dropdown row; full = account notification center row. */
  variant?: 'compact' | 'full';
  icon?: GlyphName;
  title?: string;
  /** Body line (full variant only). */
  message?: string;
  /** Relative timestamp / date label. */
  time?: string;
  /** Resolved category badge label (full variant only), e.g. "Reserva". */
  categoryLabel?: string;
  /** Trailing coral call-to-action label (full variant only). */
  actionLabel?: string;
  /** Replaces actionLabel with a "Reseña enviada" confirmation. */
  reviewed?: boolean;
  /** Unread → coral tint, bolder title, trailing dot. */
  unread?: boolean;
  /** Draw a top divider (for stacking in a list; full variant). */
  divider?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** A single notification row — header dropdown (compact) or account center (full). */
export declare const NotificationItem: React.FC<NotificationItemProps>;
export default NotificationItem;
