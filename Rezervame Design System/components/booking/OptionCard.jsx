import React from 'react';
import { Glyph } from '../core/Glyph.jsx';

/**
 * OptionCard — a large, Fresha-style choice card: title + subtitle on the left,
 * an accent icon on the right. Used for the booking-type step (individual vs
 * group) and any other "pick one of a few paths" screen.
 */
export function OptionCard({ icon = 'calendar', title, subtitle, onClick, selected = false, style }) {
  const [hover, setHover] = React.useState(false);
  const active = hover || selected;
  return (
    <button
      type="button" onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 18, width: '100%', textAlign: 'left',
        padding: '20px 22px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
        background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)',
        border: `1.5px solid ${active ? 'var(--rz-coral)' : 'var(--border-subtle)'}`,
        boxShadow: active ? 'var(--shadow-md)' : 'var(--shadow-card)',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'border-color var(--dur-base), box-shadow var(--dur-base), transform var(--dur-base)',
        ...style,
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 17, fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: '-0.01em' }}>{title}</span>
        {subtitle && <span style={{ display: 'block', fontSize: 13.5, color: 'var(--rz-gray-500)', marginTop: 4, lineHeight: 1.45 }}>{subtitle}</span>}
      </span>
      <span style={{ flex: 'none', width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: active ? 'var(--rz-coral)' : 'var(--rz-coral-050)', color: active ? '#fff' : 'var(--rz-coral)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background var(--dur-base), color var(--dur-base)' }}>
        <Glyph name={icon} size={24} />
      </span>
    </button>
  );
}
export default OptionCard;
