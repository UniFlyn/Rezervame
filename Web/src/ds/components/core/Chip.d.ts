import * as React from 'react';
import { GlyphName } from './Glyph';
export interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  icon?: GlyphName;
  count?: number;
  uppercase?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** Filter chip for pill filter rows (TODOS / MUJERES / HOMBRES). Navy when active. */
export declare const Chip: React.FC<ChipProps>;
export default Chip;
