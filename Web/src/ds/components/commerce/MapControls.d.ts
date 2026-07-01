import * as React from 'react';
export interface MapControlsProps {
  /** Label for the show/focus map button. */
  showLabel?: string;
  /** Label for the hide map button. */
  hideLabel?: string;
  /** Whether the map is currently visible (marks "Ver mapa" active). */
  mapActive?: boolean;
  onShowMap?: () => void;
  onHideMap?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}
/**
 * Map controls — a single state-dependent toggle shown near the results map:
 * "Ver mapa" (solid) when the map is hidden, "Ocultar mapa" (outline) when the
 * map is visible. Built from MapToggleButton.
 * @startingPoint section="Commerce" subtitle="Map toggle (Ver / Ocultar mapa)" viewport="220x80"
 */
export declare const MapControls: React.FC<MapControlsProps>;
export default MapControls;
