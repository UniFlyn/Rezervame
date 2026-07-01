import React from 'react';
import { Glyph } from '../core/Glyph.jsx';
import { Badge } from '../core/Badge.jsx';
import { Button } from '../core/Button.jsx';

/**
 * Business / venue LIST ROW — the horizontal counterpart of BusinessCard, used
 * as the default layout of the search-results / business-listing page.
 *
 * Tuned for fast comparison: fixed-height rows so every result lines up, a
 * consistent-ratio image on the left, a tight information column in the middle
 * (category eyebrow, prominent name, rating, location · distance, service tags,
 * today's availability) and an isolated price + "Rezervame" rail on the right.
 * The whole row is clickable (→ venue detail); the CTA is the primary booking
 * action. `active` highlights the row when its map marker is selected.
 */
export function BusinessListItem({
  image, name, rating, reviews, category, location, distance,
  services = [], hoursToday, priceFrom, priceTo,
  badge, badgeTone = 'coral', favorite = false, onFavorite, onClick, onReserve,
  ctaLabel = 'Rezervame', active = false, onMouseEnter, onMouseLeave, style,
}) {
  const [hover, setHover] = React.useState(false);
  const lifted = hover || active;

  const previewCount = 3;
  const shown = services.slice(0, previewCount);
  const extra = Math.max(0, services.length - previewCount);

  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => { setHover(true); onMouseEnter && onMouseEnter(e); }}
      onMouseLeave={(e) => { setHover(false); onMouseLeave && onMouseLeave(e); }}
      style={{
        display: 'flex',
        height: 168,
        background: 'var(--surface-card)',
        border: `1.5px solid ${active ? 'var(--rz-coral)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: lifted ? '0 12px 28px rgba(2,48,71,0.10)' : '0 2px 8px rgba(2,48,71,0.05)',
        overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        transform: lifted ? 'translateY(-2px)' : 'none',
        transition: 'transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)',
        ...style,
      }}
    >
      {/* Image — fixed 4:3, fills row height for a consistent grid feel */}
      <div style={{ position: 'relative', flex: 'none', width: 224, height: '100%', background: 'var(--rz-gray-100)', overflow: 'hidden' }}>
        {image && (
          <img src={image} alt={name} style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transform: lifted ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform var(--dur-slow) var(--ease-out)',
          }} />
        )}
        {badge && <span style={{ position: 'absolute', top: 12, left: 12 }}><Badge tone={badgeTone} size="sm">{badge}</Badge></span>}
        <button
          aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          onClick={(e) => { e.stopPropagation(); onFavorite && onFavorite(); }}
          style={{
            position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.94)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: favorite ? 'var(--rz-coral)' : 'var(--rz-gray-600)', boxShadow: 'var(--shadow-sm)',
            transition: 'color var(--dur-base), transform var(--dur-fast)',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = ''; }}
        >
          <Glyph name="heart" size={17} filled={favorite} />
        </button>
      </div>

      {/* Content — tight, top-aligned, no wasted vertical space */}
      <div style={{ flex: 1, minWidth: 0, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {/* Category eyebrow + rating */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {category ? (
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rz-coral)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{category}</span>
          ) : <span />}
          {rating != null && (
            <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Glyph name="star" size={14} filled style={{ color: 'var(--rz-gold)' }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--rz-navy)' }}>{Number(rating).toFixed(1)}</span>
              {reviews != null && <span style={{ fontSize: 12.5, color: 'var(--rz-gray-400)' }}>({reviews})</span>}
            </span>
          )}
        </div>

        {/* Name */}
        <h4 style={{ fontSize: 19, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1.2, letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</h4>

        {/* Location · distance */}
        {(location || distance) && (
          <p style={{ fontSize: 13, color: 'var(--rz-gray-500)', display: 'flex', alignItems: 'center', gap: 5, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Glyph name="mapPin" size={13} style={{ color: 'var(--rz-gray-400)', flex: 'none' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{[location, distance].filter(Boolean).join(' · ')}</span>
          </p>
        )}

        {/* Service tags */}
        {shown.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, alignItems: 'center', overflow: 'hidden' }}>
            {shown.map((s, i) => (
              <span key={i} style={{
                flex: 'none', fontSize: 11.5, color: 'var(--rz-gray-600)', background: 'var(--rz-gray-100)',
                padding: '3px 9px', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap',
                maxWidth: 132, overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{s}</span>
            ))}
            {extra > 0 && (
              <span style={{ flex: 'none', fontSize: 11.5, fontWeight: 600, color: 'var(--rz-coral)', whiteSpace: 'nowrap' }}>+{extra}</span>
            )}
          </div>
        )}

        {/* Availability — pushed to the bottom of the column */}
        {hoursToday && (
          <span style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--rz-gray-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ flex: 'none', width: 7, height: 7, borderRadius: '50%', background: 'var(--rz-success)' }} />
            <span style={{ fontWeight: 600, color: 'var(--rz-success)' }}>Hoy</span>
            <span style={{ color: 'var(--rz-gray-300)' }}>·</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{hoursToday}</span>
          </span>
        )}
      </div>

      {/* Right rail — isolated price + CTA, vertically centered */}
      <div style={{
        flex: 'none', width: 168, padding: '14px 18px', borderLeft: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'space-between', gap: 14,
      }}>
        {priceFrom != null ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--rz-gray-400)' }}>Desde</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1.1, marginTop: 1 }}>${priceFrom}</div>
          </div>
        ) : <span />}
        <Button
          variant="primary"
          size="sm"
          fullWidth
          style={{ fontSize: 14.5 }}
          onClick={(e) => { e.stopPropagation(); (onReserve || onClick) && (onReserve || onClick)(); }}
        >{ctaLabel}</Button>
      </div>
    </div>
  );
}
export default BusinessListItem;
