import * as React from 'react';
import { GlyphName } from '../core/Glyph';
export interface MapMarkerProps {
  variant?: 'pin' | 'price' | 'dot';
  /** Price label for the 'price' variant (e.g. "$65"). */
  label?: string;
  icon?: GlyphName;
  /** Active/hover/selected — price markers flip to coral fill + white text, enlarge. */
  active?: boolean;
  /** Dimmed — when ANOTHER marker is selected: softened but still clearly visible. */
  dimmed?: boolean;
  style?: React.CSSProperties;
}
/** Map marker — teardrop pin, three-state price pill (default / coral active / dimmed), or dot. */
export declare const MapMarker: React.FC<MapMarkerProps>;
export default MapMarker;
