import React from 'react';
import { Glyph } from '../core/Glyph.jsx';

/**
 * Toast / notification snackbar. tone sets the accent icon + color.
 */
export function Toast({ tone = 'success', title, message, onClose, icon, style }) {
  const tones = {
    success: { c: 'var(--rz-success)', bg: 'var(--rz-success-bg)', i: 'checkCircle' },
    error: { c: 'var(--rz-error)', bg: 'var(--rz-error-bg)', i: 'close' },
    warning: { c: 'var(--rz-warning)', bg: 'var(--rz-warning-bg)', i: 'bell' },
    info: { c: 'var(--rz-info)', bg: 'var(--rz-info-bg)', i: 'bell' },
    coral: { c: 'var(--rz-coral)', bg: 'var(--rz-coral-050)', i: 'heart' },
  };
  const t = tones[tone] || tones.success;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      width: 360, maxWidth: '100%', padding: 14,
      background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', ...style,
    }}>
      <span style={{ width: 36, height: 36, flex: 'none', borderRadius: 10, background: t.bg, color: t.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Glyph name={icon || t.i} size={20} />
      </span>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        {title && <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rz-navy)' }}>{title}</div>}
        {message && <div style={{ fontSize: 13, color: 'var(--rz-gray-600)', marginTop: 2, lineHeight: 1.4 }}>{message}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rz-gray-400)', padding: 2, display: 'flex' }}>
          <Glyph name="close" size={16} />
        </button>
      )}
    </div>
  );
}
export default Toast;
