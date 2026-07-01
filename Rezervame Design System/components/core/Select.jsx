import React from 'react';
import { Glyph } from './Glyph.jsx';

/** Select / dropdown trigger. Matches Input styling with a chevron. */
export function Select({ label, value, placeholder = 'Selecciona', options = [], onChange, disabled = false, style, containerStyle }) {
  const [open, setOpen] = React.useState(false);
  const opts = options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
  const selected = opts.find((o) => o.value === value);

  return (
    <div style={{ position: 'relative', ...containerStyle }}>
      {label && <span style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: 'var(--rz-gray-700)' }}>{label}</span>}
      <button
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          width: '100%', height: 48, padding: '0 16px',
          background: disabled ? 'var(--rz-gray-100)' : 'var(--surface-card)',
          border: `1.5px solid ${open ? 'var(--rz-coral)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 15,
          color: selected ? 'var(--rz-gray-900)' : 'var(--text-placeholder)',
          boxShadow: open ? '0 0 0 4px var(--focus-ring)' : 'none',
          transition: 'all var(--dur-base)', ...style,
        }}
      >
        {selected ? selected.label : placeholder}
        <Glyph name="chevronDown" size={18} style={{ color: 'var(--rz-gray-500)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-base)' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20,
          background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: 6, maxHeight: 240, overflowY: 'auto',
        }}>
          {opts.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange && onChange(o.value); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '10px 12px', border: 'none', background: o.value === value ? 'var(--rz-coral-050)' : 'transparent',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-sans)', fontSize: 14,
                color: o.value === value ? 'var(--rz-coral-700)' : 'var(--rz-gray-700)', fontWeight: o.value === value ? 600 : 400,
              }}
              onMouseEnter={(e) => { if (o.value !== value) e.currentTarget.style.background = 'var(--rz-gray-100)'; }}
              onMouseLeave={(e) => { if (o.value !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              {o.label}
              {o.value === value && <Glyph name="check" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export default Select;
