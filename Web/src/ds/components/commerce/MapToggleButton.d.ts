import * as React from 'react';
import { GlyphName } from '../core/Glyph';
export interface MapToggleButtonProps {
  children?: React.ReactNode;
  /** Leading glyph (e.g. "mapPin", "close"). */
  icon?: GlyphName;
  /** 'solid' = default action (navy fill when active); 'outline' = secondary. */
  variant?: 'solid' | 'outline';
  /** Active/current view — solid fills navy, outline shows a navy border. */
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/**
 * Compact map control button — solid (default/active navy) or outline (secondary),
 * with default · hover · active · disabled states.
 * @startingPoint section="Commerce" subtitle="Map control button" viewport="200x80"
 */
export declare const MapToggleButton: React.FC<MapToggleButtonProps>;
export default MapToggleButton;
