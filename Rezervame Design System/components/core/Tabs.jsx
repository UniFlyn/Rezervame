import React from 'react';

/**
 * Segmented tabs — the gray pill container with a white active pill
 * (Servicios / Equipo / Portfolio / Reseñas / Amenidades).
 */
export function Tabs({ items = [], value, onChange, style }) {
  const [internal, setInternal] = React.useState(items[0]?.value ?? items[0]);
  const current = value !== undefined ? value : internal;
  const select = (v) => { setInternal(v); onChange && onChange(v); };

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: 6, background: 'var(--rz-gray-100)',
      borderRadius: 'var(--radius-pill)',
      ...style,
    }}>
      {items.map((it) => {
        const v = it.value ?? it;
        const label = it.label ?? it;
        const active = v === current;
        return (
          <button
            key={v}
            onClick={() => select(v)}
            style={{
              padding: '9px 20px',
              fontFamily: 'var(--font-sans)', fontSize: 14,
              fontWeight: active ? 700 : 500,
              color: active ? 'var(--rz-navy)' : 'var(--rz-gray-600)',
              background: active ? 'var(--surface-card)' : 'transparent',
              border: 'none', borderRadius: 'var(--radius-pill)',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all var(--dur-base)',
            }}
          >{label}</button>
        );
      })}
    </div>
  );
}
export default Tabs;
