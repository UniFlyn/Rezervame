import React from 'react';
import { Glyph } from '../core/Glyph.jsx';
import { Rating } from '../core/Rating.jsx';
import { Button } from '../core/Button.jsx';

/**
 * Staff / professional card — photo, name, role, rating, a 4-up stat grid,
 * "Sobre mí" bio, and a full-width VER DISPONIBILIDAD action.
 */
export function StaffCard({
  photo, name, role, rating, reviews, stats = [], bio,
  actionLabel = 'Ver disponibilidad', onAction, style, compact = false,
}) {
  const pad = compact ? 14 : 18;
  const circle = compact ? 32 : 38;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden', ...style,
    }}>
      <div style={{ aspectRatio: compact ? '4 / 3' : '1 / 1', background: 'var(--rz-gray-100)', overflow: 'hidden' }}>
        {photo && <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ padding: pad, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h4 style={{ fontSize: compact ? 15.5 : 17, fontWeight: 700, color: 'var(--rz-navy)' }}>{name}</h4>
        {role && <p style={{ fontSize: compact ? 12 : 13, color: 'var(--rz-gray-500)', marginTop: 2 }}>{role}</p>}
        {rating != null && (
          <div style={{ marginTop: compact ? 6 : 8 }}>
            <Rating value={rating} count={reviews} layout="compact" size={compact ? 14 : 15} />
          </div>
        )}
        {stats.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: compact ? 6 : 8, margin: compact ? '12px 0' : '16px 0' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: circle, height: circle, margin: compact ? '0 auto 4px' : '0 auto 6px', borderRadius: '50%',
                  background: 'var(--rz-coral-050)', color: 'var(--rz-coral)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Glyph name={s.icon || 'user'} size={compact ? 15 : 17} />
                </div>
                <div style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: 'var(--rz-navy)' }}>{s.value}</div>
                <div style={{ fontSize: compact ? 9 : 10, color: 'var(--rz-gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
        {bio && (
          <p style={{ fontSize: compact ? 12 : 13, color: 'var(--rz-gray-600)', lineHeight: 1.5, marginBottom: compact ? 12 : 16 }}>
            <span style={{ fontWeight: 700, color: 'var(--rz-navy)' }}>Sobre mí: </span>{bio}
          </p>
        )}
        <Button variant="outline" size="sm" uppercase fullWidth onClick={onAction} style={{ marginTop: 'auto' }}>{actionLabel}</Button>
      </div>
    </div>
  );
}
export default StaffCard;
