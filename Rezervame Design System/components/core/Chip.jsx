import React from 'react';
import { Glyph } from './Glyph.jsx';

/**
 * Filter chip — used in pill filter rows (TODOS / MUJERES / HOMBRES …).
 * active solid chip = navy fill; inactive = white with border.
 * Set `pillStyle="tab"` for the white-active segmented look.
 */
export function Chip({ children, active = false, icon, count, uppercase = true, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        height: 40, padding: '0 18px',
        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
        letterSpacing: uppercase ? 'var(--ls-wide)' : 'var(--ls-tight)',
        textTransform: uppercase ? 'uppercase' : 'none',
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        background: active ? 'var(--rz-navy)' : 'var(--surface-card)',
        color: active ? '#fff' : 'var(--rz-gray-700)',
        border: active ? '1.5px solid var(--rz-navy)' : '1.5px solid var(--border-default)',
        transition: 'all var(--dur-base)',
        ...style,
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--rz-coral)'; e.currentTarget.style.color = 'var(--rz-coral)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--rz-gray-700)'; } }}
    >
      {icon && <Glyph name={icon} size={15} />}
      {children}
      {count != null && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 'var(--radius-pill)',
          background: active ? 'rgba(255,255,255,0.22)' : 'var(--rz-gray-100)',
          color: active ? '#fff' : 'var(--rz-gray-600)',
        }}>{count}</span>
      )}
    </button>
  );
}
export default Chip;
