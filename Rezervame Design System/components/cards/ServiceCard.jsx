import React from 'react';
import { Glyph } from '../core/Glyph.jsx';
import { Button } from '../core/Button.jsx';

/**
 * Service line-item card (venue services list).
 * Selected state: coral border + coral title + coral duration.
 */
export function ServiceCard({
  name, description, duration, price, currency = '$',
  selected = false, actionLabel = 'Rezervame', onAction, style,
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20,
      padding: '20px 22px',
      background: 'var(--surface-card)',
      border: `1.5px solid ${selected ? 'var(--rz-coral)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-md)',
      transition: 'border-color var(--dur-base), box-shadow var(--dur-base)',
      ...style,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          fontSize: 16, fontWeight: 700, marginBottom: 4,
          color: selected ? 'var(--rz-coral)' : 'var(--rz-navy)',
        }}>{name}</h4>
        {description && (
          <p style={{ fontSize: 14, color: 'var(--rz-gray-600)', lineHeight: 1.45, marginBottom: 8 }}>{description}</p>
        )}
        {duration && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, letterSpacing: 'var(--ls-wide)', textTransform: 'uppercase',
            color: selected ? 'var(--rz-coral)' : 'var(--rz-gray-500)',
          }}>
            <Glyph name="clock" size={14} /> {duration}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 'none' }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--rz-navy)' }}>{currency}{price}</span>
        <Button variant="outline" size="sm" uppercase onClick={onAction}>{actionLabel}</Button>
      </div>
    </div>
  );
}
export default ServiceCard;
