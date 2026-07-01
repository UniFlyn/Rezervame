import React from 'react';
import { Glyph } from '../core/Glyph.jsx';
import { Badge } from '../core/Badge.jsx';

/**
 * A single notification row. One component, two layouts:
 *  - variant="compact": the header bell dropdown (icon · title · time · dot).
 *  - variant="full":    the Account notification center (toned icon · title +
 *    category badge · message · date + action/reviewed · dot, with optional
 *    top divider for list stacking).
 *
 * States: unread (coral tint + dot + bolder title) / read, plus hover.
 * The icon-tone map lives here so every surface stays consistent.
 */
const NOTIF_TONE = {
  calendar: { bg: 'var(--rz-coral-050)', fg: 'var(--rz-coral)' },
  checkCircle: { bg: 'var(--rz-success-bg)', fg: 'var(--rz-success)' },
  lock: { bg: 'var(--rz-info-bg, #e8f1fb)', fg: 'var(--rz-info, #2a6fdb)' },
  star: { bg: 'rgba(245,176,65,0.16)', fg: '#c98a12' },
  heart: { bg: 'var(--rz-coral-050)', fg: 'var(--rz-coral)' },
  arrowLeft: { bg: 'var(--rz-gray-100)', fg: 'var(--rz-gray-600)' },
  close: { bg: 'rgba(216,69,58,0.10)', fg: 'var(--rz-error, #d8453a)' },
  sparkles: { bg: 'var(--rz-coral-050)', fg: 'var(--rz-coral)' },
};

export function NotificationItem({
  variant = 'full',
  icon = 'bell', title, message, time,
  categoryLabel, actionLabel, reviewed = false,
  unread = false, divider = false, onClick, style,
}) {
  const compact = variant === 'compact';

  if (compact) {
    const restBg = unread ? 'rgba(255,87,87,0.045)' : 'transparent';
    return (
      <button
        type="button" onClick={onClick}
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start', gap: 13,
          padding: '12px 12px', background: restBg, border: 'none',
          borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
          fontFamily: 'var(--font-sans)', transition: 'background var(--dur-fast) var(--ease-standard)',
          ...style,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rz-gray-050)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = restBg; }}
      >
        <span style={{ flex: 'none', width: 38, height: 38, borderRadius: '50%', background: 'var(--rz-coral-050)', color: 'var(--rz-coral)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Glyph name={icon || 'bell'} size={18} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13.5, color: 'var(--rz-navy)', lineHeight: 1.42, fontWeight: unread ? 600 : 500 }}>{title}</span>
          {time && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--rz-gray-500)', marginTop: 4, fontWeight: 500 }}>{time}</span>}
        </span>
        {unread && <span style={{ flex: 'none', width: 8, height: 8, borderRadius: '50%', background: 'var(--rz-coral)', marginTop: 7 }} />}
      </button>
    );
  }

  // ---- full (account center) ----
  const tone = NOTIF_TONE[icon] || { bg: 'var(--rz-gray-100)', fg: 'var(--rz-gray-600)' };
  const restBg = unread ? 'rgba(255,87,87,0.05)' : '#fff';
  return (
    <button
      type="button" onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'flex-start', gap: 16, textAlign: 'left',
        padding: '18px 20px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
        border: 'none', borderTop: divider ? '1px solid var(--border-subtle)' : 'none',
        background: restBg, transition: 'background var(--dur-fast) var(--ease-standard)',
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = unread ? 'rgba(255,87,87,0.09)' : 'var(--rz-gray-050)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = restBg; }}
    >
      <span style={{ flex: 'none', width: 44, height: 44, borderRadius: '50%', background: tone.bg, color: tone.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        <Glyph name={icon} size={20} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: unread ? 700 : 600, color: 'var(--rz-navy)', lineHeight: 1.35 }}>{title}</span>
          {categoryLabel && <Badge tone="neutral" size="sm">{categoryLabel}</Badge>}
        </span>
        {message && <span style={{ display: 'block', fontSize: 13.5, color: 'var(--rz-gray-500)', marginTop: 5, lineHeight: 1.5 }}>{message}</span>}
        <span style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
          {time && <span style={{ fontSize: 12.5, color: 'var(--rz-gray-400)', fontWeight: 500 }}>{time}</span>}
          {reviewed ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: 'var(--rz-success)' }}>
              <Glyph name="checkCircle" size={15} /> Reseña enviada
            </span>
          ) : actionLabel && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: 'var(--rz-coral)' }}>
              {actionLabel} <Glyph name="chevronRight" size={15} />
            </span>
          )}
        </span>
      </span>
      {unread && <span style={{ flex: 'none', width: 9, height: 9, borderRadius: '50%', background: 'var(--rz-coral)', marginTop: 8 }} />}
    </button>
  );
}
export default NotificationItem;
