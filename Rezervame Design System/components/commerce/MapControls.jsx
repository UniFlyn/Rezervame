import React from 'react';
import { MapToggleButton } from './MapToggleButton.jsx';

/**
 * Map controls bar — the two map actions shown ABOVE the results map:
 *  - "Ver mapa"     : solid, marked active while the map is visible (show/focus)
 *  - "Ocultar mapa" : outline secondary — hide the map panel
 * Just two controls. No "Vista lista" here (list/grid view lives in the
 * results toolbar). Grouped to the left with comfortable spacing.
 */
export function MapControls({
  showLabel = 'Ver mapa',
  hideLabel = 'Ocultar mapa',
  mapActive = true,
  onShowMap,
  onHideMap,
  disabled = false,
  style,
}) {
  // Single state-dependent toggle: "Ver mapa" only when the map is hidden,
  // "Ocultar mapa" only when the map is visible.
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...style }}>
      {mapActive
        ? <MapToggleButton icon="close" variant="outline" disabled={disabled} onClick={onHideMap}>{hideLabel}</MapToggleButton>
        : <MapToggleButton icon="mapPin" variant="solid" active disabled={disabled} onClick={onShowMap}>{showLabel}</MapToggleButton>}
    </div>
  );
}
export default MapControls;
