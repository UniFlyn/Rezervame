import React from 'react';
import { Glyph } from '../core/Glyph.jsx';
import { Badge } from '../core/Badge.jsx';
import { Button } from '../core/Button.jsx';

/**
 * Business / venue card (Recomendados, Mejor valorados, Nuevos, Cerca de mí).
 *
 * Rezervame 2.0 layout — image on top with overlaid favourite heart (top-right)
 * and an OPTIONAL badge (top-left). Below: name + rating row, review count,
 * category chip, location · distance, a short service preview ("Ver más"),
 * today's hours + price range, and a centered "Rezérvame" CTA. The whole card
 * is clickable; the CTA is the primary booking action.
 */
export function BusinessCard({
  image, name, rating, reviews, category, location, distance,
  services = [], hoursToday, priceFrom, priceTo,
  badge, badgeTone = 'coral', favorite = false, onFavorite, onClick, onReserve,
  ctaLabel = 'Rezervame', style,
}) {
  const [hover, setHover] = React.useState(false);

  const previewCount = 2;
  const shown = services.slice(0, previewCount);
  const extra = Math.max(0, services.length - previewCount);

  const price = priceFrom != null
    ? (priceTo != null && priceTo !== priceFrom ? `$${priceFrom} – $${priceTo}` : `Desde $${priceFrom}`)
    : null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', flexDirection: 'column',
        height: 438,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: hover && onClick ? '0 12px 28px rgba(2,48,71,0.10)' : '0 2px 8px rgba(2,48,71,0.05)',
        overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        transform: hover && onClick ? 'translateY(-3px)' : 'none',
        transition: 'transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)',
        ...style,
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '16 / 10', background: 'var(--rz-gray-100)', overflow: 'hidden' }}>
        {image && (
          <img src={image} alt={name} style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transform: hover && onClick ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform var(--dur-slow) var(--ease-out)',
          }} />
        )}
        {badge && <span style={{ position: 'absolute', top: 12, left: 12 }}><Badge tone={badgeTone} size="sm">{badge}</Badge></span>}
        <button
          aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          onClick={(e) => { e.stopPropagation(); onFavorite && onFavorite(); }}
          style={{
            position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.94)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: favorite ? 'var(--rz-coral)' : 'var(--rz-gray-600)', boxShadow: 'var(--shadow-sm)',
            transition: 'color var(--dur-base), transform var(--dur-fast)',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = ''; }}
        >
          <Glyph name="heart" size={18} filled={favorite} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '13px 15px 15px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
        {/* Name + rating */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--rz-navy)', lineHeight: 1.25, letterSpacing: '-0.2px', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</h4>
          {rating != null && (
            <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: 'var(--rz-navy)' }}>
              <Glyph name="star" size={14} filled style={{ color: 'var(--rz-gold)' }} />
              {Number(rating).toFixed(1)}
            </span>
          )}
        </div>

        {/* Category chip + review count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: -2 }}>
          {category && (
            <span style={{
              flex: 'none', fontSize: 13, fontWeight: 600, color: 'var(--rz-navy)',
            }}>{category}</span>
          )}
          {reviews != null && (
            <span style={{ fontSize: 12.5, color: 'var(--rz-gray-400)' }}>{reviews} reseñas</span>
          )}
        </div>

        {/* Location · distance */}
        {(location || distance) && (
          <p style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', display: 'flex', alignItems: 'center', gap: 5, lineHeight: 1.3 }}>
            <Glyph name="mapPin" size={13} style={{ color: 'var(--rz-gray-400)', flex: 'none' }} />
            <span>{[location, distance].filter(Boolean).join(' · ')}</span>
          </p>
        )}

        {/* Service preview */}
        {shown.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, alignItems: 'center', overflow: 'hidden' }}>
            {shown.map((s, i) => (
              <span key={i} style={{
                fontSize: 11.5, color: 'var(--rz-gray-600)', background: 'var(--rz-gray-100)',
                padding: '4px 9px', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap',
                maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{s}</span>
            ))}
            {extra > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, color: 'var(--rz-coral)',
                  background: 'none', border: 'none', padding: '4px 2px', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >+{extra} Ver más</button>
            )}
          </div>
        )}

        {/* Hours + price */}
        {(hoursToday || price) && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            paddingTop: 9, marginTop: 'auto', borderTop: '1px solid var(--border-subtle)',
          }}>
            {hoursToday && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--rz-gray-600)', minWidth: 0 }}>
                <Glyph name="clock" size={13} style={{ color: 'var(--rz-gray-400)', flex: 'none' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Hoy: {hoursToday}</span>
              </span>
            )}
            {price && (
              <span style={{ flex: 'none', fontSize: 14, fontWeight: 700, color: 'var(--rz-navy)' }}>{price}</span>
            )}
          </div>
        )}

        {/* CTA */}
        <Button
          variant="outline"
          size="sm"
          fullWidth
          style={{ marginTop: 4, fontSize: 14.5 }}
          onClick={(e) => { e.stopPropagation(); (onReserve || onClick) && (onReserve || onClick)(); }}
        >{ctaLabel}</Button>
      </div>
    </div>
  );
}
export default BusinessCard;
