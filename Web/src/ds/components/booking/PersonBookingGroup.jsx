import React from 'react';
import { Glyph } from '../core/Glyph.jsx';
import { Avatar } from '../core/Avatar.jsx';
import { Badge } from '../core/Badge.jsx';

/**
 * PersonBookingGroup — a person "block" that nests the services assigned to one
 * recipient. Used in the group-booking flow, the grouped reservation summary and
 * the reservation-details view. Header shows the person (or "Para mí · Tu cuenta")
 * followed by their service rows; an optional "Agregar servicio para esta persona"
 * CTA and a per-person remove are shown when the matching handlers are passed.
 *
 * services: [{ name, meta?, price?, onRemove? }]
 */
export function PersonBookingGroup({
  name, subtitle, self = false, services = [],
  onAddService, addLabel = 'Agregar servicio para esta persona',
  onRemovePerson, emptyHint = 'Aún no has agregado servicios para esta persona.',
  style,
}) {
  return (
    <div style={{
      background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', ...style,
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--rz-gray-050)' }}>
        {self
          ? <span style={{ flex: 'none', width: 38, height: 38, borderRadius: '50%', background: 'var(--rz-coral-050)', color: 'var(--rz-coral)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Glyph name="user" size={19} /></span>
          : <Avatar name={name} size={38} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--rz-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          {(subtitle || self) && (
            <div style={{ marginTop: 2 }}>
              {self
                ? <span style={{ fontSize: 12.5, color: 'var(--rz-gray-500)' }}>Tu cuenta</span>
                : <Badge tone="neutral" size="sm" uppercase={false}>{subtitle}</Badge>}
            </div>
          )}
        </div>
        {onRemovePerson && (
          <button type="button" aria-label={`Quitar a ${name}`} onClick={onRemovePerson} style={{ flex: 'none', width: 30, height: 30, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--rz-gray-400)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rz-coral)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--rz-gray-400)'; }}><Glyph name="close" size={16} /></button>
        )}
      </div>

      {/* services */}
      <div style={{ padding: '6px 16px' }}>
        {services.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', padding: '12px 0' }}>{emptyHint}</div>
        ) : services.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-navy)', lineHeight: 1.3 }}>{s.name}</div>
              {s.meta && <div style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', marginTop: 2 }}>{s.meta}</div>}
            </div>
            {s.price != null && <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rz-navy)', flex: 'none' }}>{typeof s.price === 'number' ? `$${s.price}` : s.price}</div>}
            {s.onChange && (
              <button type="button" onClick={s.onChange} style={{ flex: 'none', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--rz-coral)' }}>Cambiar</button>
            )}
            {s.onRemove && (
              <button type="button" aria-label={`Quitar ${s.name}`} onClick={s.onRemove} style={{ flex: 'none', width: 26, height: 26, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--rz-gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rz-coral)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--rz-gray-400)'; }}><Glyph name="close" size={16} /></button>
            )}
          </div>
        ))}
      </div>

      {onAddService && (
        <button type="button" onClick={onAddService} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, margin: '2px 16px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--rz-coral)', padding: '4px 2px' }}>
          <Glyph name="plusCircle" size={17} /> {addLabel}
        </button>
      )}
    </div>
  );
}
export default PersonBookingGroup;
