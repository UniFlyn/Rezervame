import React from 'react';

/**
 * Status / label badge. Pill shape, uppercase tracked text.
 * tone: success (PAGADA), warning (PENDIENTE), error (CANCELADA),
 * info, coral, navy, neutral.
 */
export function Badge({ children, tone = 'neutral', size = 'md', dot = false, uppercase = true, style }) {
  const tones = {
    success: { bg: 'var(--rz-success-bg)', fg: 'var(--rz-success)' },
    warning: { bg: 'var(--rz-warning-bg)', fg: 'var(--rz-warning)' },
    error: { bg: 'var(--rz-error-bg)', fg: 'var(--rz-error)' },
    info: { bg: 'var(--rz-info-bg)', fg: 'var(--rz-info)' },
    coral: { bg: 'var(--rz-coral-100)', fg: 'var(--rz-coral-700)' },
    navy: { bg: 'var(--rz-navy)', fg: '#fff' },
    neutral: { bg: 'var(--rz-gray-100)', fg: 'var(--rz-gray-700)' },
  };
  const t = tones[tone] || tones.neutral;
  const sz = size === 'sm'
    ? { fs: 11, px: 9, h: 22 }
    : size === 'lg' ? { fs: 13, px: 14, h: 30 } : { fs: 12, px: 11, h: 26 };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: sz.h, padding: `0 ${sz.px}px`,
      background: t.bg, color: t.fg,
      fontSize: sz.fs, fontWeight: 700,
      letterSpacing: uppercase ? 'var(--ls-wide)' : 'var(--ls-tight)',
      textTransform: uppercase ? 'uppercase' : 'none',
      borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap',
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {children}
    </span>
  );
}
export default Badge;
