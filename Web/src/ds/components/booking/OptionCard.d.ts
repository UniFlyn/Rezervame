import * as React from 'react';
import { GlyphName } from '../core/Glyph';
export interface OptionCardProps {
  icon?: GlyphName;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  selected?: boolean;
  style?: React.CSSProperties;
}
/** Large Fresha-style choice card (title + subtitle + accent icon). */
export declare const OptionCard: React.FC<OptionCardProps>;
export default OptionCard;
