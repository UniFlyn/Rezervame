import React from 'react';
import { Glyph } from '../core/Glyph.jsx';
import { Button } from '../core/Button.jsx';

/** Empty state — icon in a soft circle, title, message and optional action. */
export function EmptyState({ icon = 'search', title, message, actionLabel, onAction, style }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      padding: '48px 24px', ...style,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: 'var(--rz-coral-050)',
        color: 'var(--rz-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
      }}>
        <Glyph name={icon} size={32} />
      </div>
      {title && <h4 style={{ fontSize: 18, fontWeight: 700, color: 'var(--rz-navy)' }}>{title}</h4>}
      {message && <p style={{ fontSize: 14, color: 'var(--rz-gray-600)', marginTop: 8, maxWidth: 360, lineHeight: 1.5 }}>{message}</p>}
      {actionLabel && <div style={{ marginTop: 20 }}><Button variant="primary" shape="pill" onClick={onAction}>{actionLabel}</Button></div>}
    </div>
  );
}
export default EmptyState;
