import React from 'react';
import { Glyph } from './Glyph.jsx';

/** Checkbox with coral checked state. */
export function Checkbox({ checked = false, onChange, label, disabled = false, style }) {
  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, ...style,
    }}>
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 22, height: 22, borderRadius: 7, flex: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: checked ? 'var(--rz-coral)' : 'var(--surface-card)',
          border: `1.5px solid ${checked ? 'var(--rz-coral)' : 'var(--border-default)'}`,
          color: '#fff', transition: 'all var(--dur-base)',
        }}
      >
        {checked && <Glyph name="check" size={15} strokeWidth={2.6} />}
      </span>
      {label && <span style={{ fontSize: 15, color: 'var(--rz-gray-700)' }}>{label}</span>}
    </label>
  );
}
export default Checkbox;
