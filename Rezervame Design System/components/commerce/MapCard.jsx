import React from 'react';
import { Glyph } from '../core/Glyph.jsx';
import { Button } from '../core/Button.jsx';
import { TruncatedReveal } from '../core/TruncatedReveal.jsx';

/**
 * Mini map preview card — a compact floating business preview shown over the
 * map when a marker is selected. Image on top, content below, CTA at the bottom.
 *  - Category: small uppercase coral eyebrow
 *  - Business name (navy) + rating on the same row, rating pushed to the right
 *  - Distance · address as secondary metadata
 *  - Full-width "Ver detalles" CTA
 */
export function MapCard({
  image, name, rating, category, distance, address,
  ctaLabel = 'Ver detalles', onCta, onClick, width = 300, compact = false, style,
}) {
  const meta = [distance, address].filter(Boolean).join(' · ');
  // Compact = tooltip format anchored to a map pin: smaller image, tighter
  // spacing, smaller CTA. Same visual language, denser footprint.
  const imgH = compact ? 86 : 150;
  const pad = compact ? 12 : 16;
  return (
    <div
      onClick={onClick}
      style={{
        width, background: 'var(--surface-card)',
        borderRadius: compact ? 'var(--radius-md)' : 'var(--radius-lg)', overflow: 'hidden',
        boxShadow: '0 18px 44px rgba(2,48,71,0.22)',
        cursor: onClick ? 'pointer' : 'default', ...style,
      }}
    >
      <div style={{ height: imgH, background: 'var(--rz-gray-100)' }}>
        {image && <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
      </div>
      <div style={{ padding: pad }}>
        {category && (
          <div style={{ fontSize: compact ? 10 : 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rz-coral)' }}>{category}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginTop: 5 }}>
          <TruncatedReveal
            as="h5"
            text={name}
            lines={compact ? 1 : 2}
            expandLines={compact ? 2 : 3}
            lineHeight={1.25}
            style={{ minWidth: 0, flex: 1, fontSize: compact ? 15 : 17, fontWeight: 600, color: 'var(--rz-navy)', letterSpacing: '-0.2px', cursor: onClick ? 'pointer' : 'default' }}
          >
            {name}
          </TruncatedReveal>
          {rating != null && (
            <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: compact ? 13 : 14, fontWeight: 600, color: 'var(--rz-navy)' }}>
              <Glyph name="star" size={compact ? 13 : 14} filled style={{ color: 'var(--rz-gold)' }} />{Number(rating).toFixed(1)}
            </span>
          )}
        </div>
        {meta && (
          <p style={{ fontSize: compact ? 12 : 13, color: 'var(--rz-gray-500)', marginTop: compact ? 5 : 7, display: 'flex', alignItems: 'center', gap: 5, lineHeight: 1.35 }}>
            <Glyph name="mapPin" size={compact ? 13 : 14} style={{ color: 'var(--rz-gray-400)', flex: 'none' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</span>
          </p>
        )}
        <div style={{ marginTop: compact ? 11 : 14 }}>
          <Button variant="primary" size={compact ? 'sm' : 'md'} fullWidth onClick={(e) => { e.stopPropagation && e.stopPropagation(); onCta && onCta(); }}>{ctaLabel}</Button>
        </div>
      </div>
    </div>
  );
}
export default MapCard;
