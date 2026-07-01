import React from 'react';

/** Toggle switch — coral when on. */
export function Switch({ checked = false, onChange, label, disabled = false, style }) {
  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 12, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, ...style,
    }}>
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 46, height: 26, borderRadius: 'var(--radius-pill)', flex: 'none', position: 'relative',
          background: checked ? 'var(--rz-coral)' : 'var(--rz-gray-300)',
          transition: 'background var(--dur-base)',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          boxShadow: 'var(--shadow-sm)', transition: 'left var(--dur-base) var(--ease-out)',
        }} />
      </span>
      {label && <span style={{ fontSize: 15, color: 'var(--rz-gray-700)' }}>{label}</span>}
    </label>
  );
}
export default Switch;
