import React from 'react';

/** Radio button with coral selected state. */
export function Radio({ checked = false, onChange, label, disabled = false, style }) {
  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, ...style,
    }}>
      <span
        onClick={() => !disabled && onChange && onChange(true)}
        style={{
          width: 22, height: 22, borderRadius: '50%', flex: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface-card)',
          border: `1.5px solid ${checked ? 'var(--rz-coral)' : 'var(--border-default)'}`,
          transition: 'all var(--dur-base)',
        }}
      >
        {checked && <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--rz-coral)' }} />}
      </span>
      {label && <span style={{ fontSize: 15, color: 'var(--rz-gray-700)' }}>{label}</span>}
    </label>
  );
}
export default Radio;
