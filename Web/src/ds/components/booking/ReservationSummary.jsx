import React from 'react';
import { Button } from '../core/Button.jsx';
import { Glyph } from '../core/Glyph.jsx';
import { RecipientBadge } from '../people/RecipientBadge.jsx';

/**
 * Reservation summary / builder panel (sticky, right column of the booking page).
 * Supports MULTIPLE services as removable line items, plus an "add another
 * service" action, the professional / date / time rows, a computed total, and
 * the primary "Confirmar reserva" CTA.
 *
 * services: [{ name, price, duration? }]
 */
export function ReservationSummary({
  services = [],
  professional,
  date,
  time,
  currency = '$',
  eyebrow = 'Tu reserva',
  confirmLabel = 'Confirmar reserva',
  addLabel = 'Agregar otro servicio',
  note = 'Cancelación gratuita hasta 24h antes de tu cita.',
  onAddService,
  onRemoveService,
  onConfirm,
  style,
}) {
  const total = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', fontSize: 14 }}>
      <span style={{ color: 'var(--rz-gray-500)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--rz-navy)', textAlign: 'right' }}>{value}</span>
    </div>
  );

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)',
      padding: 22, ...style,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rz-coral)', marginBottom: 14 }}>{eyebrow}</div>

      {/* Service line items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {services.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'var(--rz-gray-050)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-navy)', lineHeight: 1.3 }}>{s.name}</div>
              {s.duration && <div style={{ fontSize: 12, color: 'var(--rz-gray-500)', marginTop: 2 }}>{s.duration}</div>}
              {(s.for || s.recipientSelf) && <div style={{ marginTop: 5 }}><RecipientBadge name={s.for} self={!s.for} /></div>}
              {(s.professional || s.time) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px', marginTop: 6 }}>
                  {s.professional && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--rz-gray-600)' }}>
                      <Glyph name="user" size={12} style={{ color: 'var(--rz-coral)', flex: 'none' }} />{s.professional}
                    </span>
                  )}
                  {s.time && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--rz-gray-600)' }}>
                      <Glyph name="clock" size={12} style={{ color: 'var(--rz-coral)', flex: 'none' }} />{s.time}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rz-navy)', flex: 'none' }}>{currency}{s.price}</div>
            {onRemoveService && (
              <button
                aria-label={`Quitar ${s.name}`}
                onClick={() => onRemoveService(s, i)}
                style={{ flex: 'none', width: 22, height: 22, marginTop: -1, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--rz-gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rz-coral)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--rz-gray-400)'; }}
              ><Glyph name="close" size={15} /></button>
            )}
          </div>
        ))}
      </div>

      {onAddService && (
        <button
          onClick={onAddService}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 10,
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--rz-coral)', padding: '4px 2px',
          }}
        ><Glyph name="plusCircle" size={17} /> {addLabel}</button>
      )}

      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '14px 0' }} />

      {professional && <Row label="Profesional" value={professional} />}
      {date && <Row label="Fecha" value={date} />}
      {time && <Row label="Hora" value={time} />}

      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '14px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--rz-navy)' }}>Total</span>
        <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--rz-coral)' }}>{currency}{total}</span>
      </div>

      <div style={{ marginTop: 18 }}>
        <Button variant="primary" fullWidth size="lg" leftIcon="check" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
      {note && <p style={{ fontSize: 12, color: 'var(--rz-gray-500)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}
export default ReservationSummary;
