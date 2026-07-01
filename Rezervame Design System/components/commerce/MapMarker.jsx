import React from 'react';
import { Glyph } from '../core/Glyph.jsx';

/**
 * Map marker. variant:
 *  - pin: classic teardrop pin with an icon
 *  - price: a pill price marker with a bottom pointer. Three states:
 *    default (white pill, navy price, coral dot — high contrast/legible),
 *    active/selected (coral pill, white price, white dot, enlarged + tail),
 *    and dimmed (when ANOTHER marker is selected — softened but still clearly
 *    visible: white pill, muted text, lighter shadow, slightly smaller).
 *  - dot: small location dot
 * active raises elevation + scale.
 */
export function MapMarker({ variant = 'pin', label, icon = 'mapPin', active = false, dimmed = false, style }) {
  if (variant === 'price') {
    // Three states: default · active/selected · dimmed (a sibling is selected).
    const isDimmed = dimmed && !active;
    const CORAL = '#ff5757';   // literal so the active fill always paints, even
    const CORAL_DOT = '#ffa3a3'; // inside a transformed/composited map layer
    const bg = active ? CORAL : 'var(--surface-card)';
    const textColor = active ? '#fff' : isDimmed ? 'var(--rz-gray-500)' : 'var(--rz-navy)';
    return (
      <span style={{ position: 'relative', display: 'inline-flex', opacity: isDimmed ? 0.94 : 1, ...style }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px',
          background: bg, color: textColor,
          fontSize: 14, fontWeight: 700, borderRadius: 'var(--radius-pill)',
          border: active ? `1px solid ${CORAL}`
            : isDimmed ? '1px solid var(--border-subtle)' : '1px solid var(--rz-navy-100)',
          boxShadow: active ? '0 10px 22px rgba(255,87,87,0.38)'
            : isDimmed ? '0 2px 7px rgba(2,48,71,0.12)' : '0 4px 13px rgba(2,48,71,0.22)',
          transform: active ? 'scale(1.16)' : isDimmed ? 'scale(0.94)' : 'none',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: active ? '#fff' : isDimmed ? CORAL_DOT : CORAL }} />
          {label}
        </span>
        {/* bottom pointer / tail — active (selected) state only */}
        {active && (
          <span style={{
            position: 'absolute', left: '50%', bottom: -5, transform: 'translateX(-50%) rotate(45deg)',
          width: 10, height: 10, background: CORAL,
            borderRight: `1px solid ${CORAL}`,
            borderBottom: `1px solid ${CORAL}`,
          }} />
        )}
      </span>
    );
  }
  if (variant === 'dot') {
    return (
      <span style={{ display: 'inline-flex', width: 16, height: 16, ...style }}>
        <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--rz-coral)', border: '3px solid #fff', boxShadow: 'var(--shadow-sm)' }} />
      </span>
    );
  }
  return (
    <span style={{ position: 'relative', display: 'inline-flex', filter: 'drop-shadow(0 4px 6px rgba(2,48,71,0.3))', transform: active ? 'scale(1.12)' : 'none', transition: 'transform var(--dur-base)', ...style }}>
      <svg width="38" height="46" viewBox="0 0 38 46" fill="none">
        <path d="M19 1C9.6 1 2 8.6 2 18c0 11.5 17 27 17 27s17-15.5 17-27C36 8.6 28.4 1 19 1Z" fill={active ? 'var(--rz-navy)' : 'var(--rz-coral)'} stroke="#fff" strokeWidth="2" />
        <circle cx="19" cy="18" r="10" fill="#fff" />
      </svg>
      <span style={{ position: 'absolute', top: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', color: active ? 'var(--rz-navy)' : 'var(--rz-coral)' }}>
        <Glyph name={icon} size={20} />
      </span>
    </span>
  );
}
export default MapMarker;
