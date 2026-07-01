import React from 'react';
import { Glyph } from '../core/Glyph.jsx';
import { Badge } from '../core/Badge.jsx';
import { Button } from '../core/Button.jsx';

/**
 * Business / venue GRID CARD for the SEARCH-RESULTS page — a denser, more
 * functional sibling of BusinessCard (Home). Same image-on-top discovery feel,
 * but tuned for comparison: a rating chip overlaid on the image for instant
 * scanning, a single compact meta line (category · location · distance),
 * service tags, today's availability and an isolated price + "Rezervame" footer.
 * Fixed height so every card in the grid lines up. The whole card is clickable;
 * the CTA is the primary booking action.
 */
export function BusinessResultCard({
  image, name, rating, reviews, category, location, distance,
  services = [], hoursToday, priceFrom, priceTo,
  badge, badgeTone = 'coral', favorite = false, onFavorite, onClick, onReserve,
  ctaLabel = 'Rezervame', style,
}) {
  const [hover, setHover] = React.useState(false);

  const previewCount = 1;
  const shown = services.slice(0, previewCount);
  const extra = Math.max(0, services.length - previewCount);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', flexDirection: 'column',
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
      {/* Image — stable 4:3 so merchant-uploaded photos crop cleanly, never distort.
         Overlay hierarchy is fixed by corner: top-left = status badge, top-right =
         favorite, bottom-left = rating. Each corner holds ONE element so the photo
         never feels cluttered; a faint top/bottom scrim keeps every chip legible on
         light or busy photography. */}
      <div style={{ position: 'relative', aspectRatio: '4 / 3', flex: 'none', background: 'var(--rz-gray-100)', overflow: 'hidden' }}>
        {image && (
          <img src={image} alt={name} style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transform: hover && onClick ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform var(--dur-slow) var(--ease-out)',
          }} />
        )}

        {/* Legibility scrim — subtle, only at the top & bottom edges where chips sit */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(2,48,71,0.20) 0%, rgba(2,48,71,0) 24%, rgba(2,48,71,0) 72%, rgba(2,48,71,0.22) 100%)',
        }} />

        {/* TOP-LEFT — status badge only (Nuevo · Verificado · Destacado) */}
        {badge && <span style={{ position: 'absolute', top: 10, left: 10 }}><Badge tone={badgeTone} size="sm">{badge}</Badge></span>}

        {/* TOP-RIGHT — favorite */}
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

        {/* BOTTOM-LEFT — rating + review count, e.g. ★ 4.8 (142) */}
        {rating != null && (
          <span style={{
            position: 'absolute', bottom: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 5,
            height: 24, padding: '0 9px', borderRadius: 'var(--radius-pill)',
            background: 'rgba(255,255,255,0.96)', boxShadow: 'var(--shadow-sm)',
          }}>
            <Glyph name="star" size={13} filled style={{ color: 'var(--rz-gold)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1 }}>{Number(rating).toFixed(1)}</span>
            {reviews != null && <span style={{ fontSize: 11.5, color: 'var(--rz-gray-400)', lineHeight: 1 }}>({reviews})</span>}
          </span>
        )}
      </div>

      {/* Content — structured listing block: category eyebrow, name + price,
         location, a single service chip, then an availability + compact CTA footer */}
      <div style={{ padding: '12px 14px 13px', display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minHeight: 0 }}>
        {/* Category eyebrow — a listing-style label, not a Home-style chip */}
        {category && (
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rz-coral)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{category}</span>
        )}

        {/* Name + price (top-right) */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <h4 style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1.2, letterSpacing: '-0.25px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</h4>
          {priceFrom != null && (
            <div style={{ flex: 'none', textAlign: 'right', lineHeight: 1 }}>
              <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--rz-gray-400)' }}>Desde</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1.15, marginTop: 2 }}>${priceFrom}</div>
            </div>
          )}
        </div>

        {/* Location · distance */}
        {(location || distance) && (
          <p style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Glyph name="mapPin" size={13} style={{ color: 'var(--rz-gray-400)', flex: 'none' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{[location, distance].filter(Boolean).join(' · ')}</span>
          </p>
        )}

        {/* Service tags — minimal, just the headline service + a "+N" */}
        {shown.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, alignItems: 'center', overflow: 'hidden' }}>
            {shown.map((s, i) => (
              <span key={i} style={{
                flex: 'none', fontSize: 11.5, color: 'var(--rz-gray-600)', background: 'var(--rz-gray-100)',
                padding: '3px 9px', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap',
                maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{s}</span>
            ))}
            {extra > 0 && (
              <span style={{ flex: 'none', fontSize: 11.5, fontWeight: 600, color: 'var(--rz-coral)', whiteSpace: 'nowrap' }}>+{extra}</span>
            )}
          </div>
        )}

        {/* Footer — availability + a compact, low-dominance outline CTA */}
        <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {hoursToday && (
            <span style={{ flex: 1, minWidth: 0, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--rz-gray-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ flex: 'none', width: 7, height: 7, borderRadius: '50%', background: 'var(--rz-success)' }} />
              <span style={{ fontWeight: 600, color: 'var(--rz-success)' }}>Hoy</span>
              <span style={{ color: 'var(--rz-gray-300)' }}>·</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{hoursToday}</span>
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            style={{ flex: 'none', fontSize: 13.5 }}
            onClick={(e) => { e.stopPropagation(); (onReserve || onClick) && (onReserve || onClick)(); }}
          >{ctaLabel}</Button>
        </div>
      </div>
    </div>
  );
}
export default BusinessResultCard;
