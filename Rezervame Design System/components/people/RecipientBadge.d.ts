import * as React from 'react';
import { GlyphName } from '../core/Glyph';
export interface RecipientBadgeProps {
  /** Person's name. Omit (or set self) for the account owner. */
  name?: string;
  /** Force the "self" (account owner) reading. */
  self?: boolean;
  /** Label used for the account owner. Default 'Ti'. */
  selfLabel?: string;
  /** Leading word. Default 'Para'. */
  prefix?: string;
  icon?: GlyphName;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}
/** Read-only "Para: X" recipient indicator. */
export declare const RecipientBadge: React.FC<RecipientBadgeProps>;
export default RecipientBadge;
