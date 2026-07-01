import React from 'react';

/**
 * Time-slot selector — a responsive grid of time pills.
 * slots: array of "9:00 AM" strings or {time, disabled}.
 * Optionally group by period label via `groups` [{label, slots}].
 */
export function TimeSlotSelector({ slots, groups, value, onChange, columns = 4, style }) {
  const renderGroup = (list) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 10 }}>
      {list.map((s) => {
        const time = typeof s === 'string' ? s : s.time;
        const disabled = typeof s === 'object' && s.disabled;
        const active = time === value;
        return (
          <button
            key={time}
            disabled={disabled}
            onClick={() => onChange && onChange(time)}
            style={{
              padding: '12px 8px', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
              borderRadius: 'var(--radius-md)', cursor: disabled ? 'not-allowed' : 'pointer',
              background: active ? 'var(--rz-coral)' : 'var(--surface-card)',
              color: active ? '#fff' : disabled ? 'var(--rz-gray-400)' : 'var(--rz-gray-700)',
              border: `1.5px solid ${active ? 'var(--rz-coral)' : 'var(--border-default)'}`,
              textDecoration: disabled ? 'line-through' : 'none',
              opacity: disabled ? 0.6 : 1, transition: 'all var(--dur-base)',
            }}
            onMouseEnter={(e) => { if (!active && !disabled) e.currentTarget.style.borderColor = 'var(--rz-coral)'; }}
            onMouseLeave={(e) => { if (!active && !disabled) e.currentTarget.style.borderColor = 'var(--border-default)'; }}
          >{time}</button>
        );
      })}
    </div>
  );

  if (groups) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, ...style }}>
        {groups.map((g) => (
          <div key={g.label}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--rz-gray-500)', marginBottom: 12 }}>{g.label}</div>
            {renderGroup(g.slots)}
          </div>
        ))}
      </div>
    );
  }
  return <div style={style}>{renderGroup(slots || [])}</div>;
}
export default TimeSlotSelector;
