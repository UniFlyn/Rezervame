import React from 'react';
import { Glyph } from './Glyph.jsx';

/**
 * Star rating display. Gold filled stars, value + review count.
 * layout: 'inline' (4.9 ★★★★★ (287 reseñas)) or 'compact' (★ 4.9 (128)).
 */
export function Rating({ value = 0, count, max = 5, size = 16, layout = 'inline', showValue = true, style }) {
  const stars = [];
  for (let i = 0; i < max; i++) {
    const fill = value >= i + 1 ? 1 : value > i ? value - i : 0;
    stars.push(
      <span key={i} style={{ position: 'relative', display: 'inline-block', width: size, height: size, color: 'var(--rz-gray-300)' }}>
        <Glyph name="star" size={size} filled style={{ color: 'var(--rz-gray-200)' }} />
        <span style={{ position: 'absolute', inset: 0, width: `${fill * 100}%`, overflow: 'hidden' }}>
          <Glyph name="star" size={size} filled style={{ color: 'var(--rz-gold)' }} />
        </span>
      </span>
    );
  }

  if (layout === 'compact') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, ...style }}>
        <Glyph name="star" size={size} filled style={{ color: 'var(--rz-gold)' }} />
        <span style={{ fontWeight: 700, fontSize: size - 1, color: 'var(--rz-navy)' }}>{value.toFixed(1)}</span>
        {count != null && <span style={{ fontSize: size - 2, color: 'var(--rz-gray-500)' }}>({count})</span>}
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...style }}>
      {showValue && <span style={{ fontWeight: 700, fontSize: size + 1, color: 'var(--rz-navy)' }}>{value.toFixed(1)}</span>}
      <span style={{ display: 'inline-flex', gap: 2 }}>{stars}</span>
      {count != null && <span style={{ fontSize: size - 2, color: 'var(--rz-gray-500)' }}>({count} reseñas)</span>}
    </span>
  );
}
export default Rating;
