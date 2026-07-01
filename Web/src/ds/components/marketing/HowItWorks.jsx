import React from 'react';
import { Glyph } from '../core/Glyph.jsx';

const STEPS = [
  { icon: 'search', title: 'Descubre', text: 'Encuentra los mejores expertos en belleza y bienestar cerca de ti.' },
  { icon: 'calendar', title: 'Reserva', text: 'Elige tu servicio y reserva una cita en línea al instante.' },
  { icon: 'checkCircle', title: 'Confirma', text: 'Revisa los detalles de tu reserva y confirma tu cita.' },
  { icon: 'sparkles', title: 'Disfruta', text: 'Llega y disfruta de tu servicio, sin complicaciones y sin esperas.' },
  { icon: 'star', title: 'Califica', text: 'Comparte tu experiencia para ayudar a otros clientes a elegir con confianza.' },
];

/**
 * "Cómo funciona Rezervame" — explains the booking flow in five steps using the
 * approved Lucide-style glyphs in circular containers. Reusable across pages.
 *
 * variant: 'light' (default, white) · 'soft' (soft gray section band) ·
 *   'accent' (soft coral wash). `compact` only reduces vertical padding.
 * Desktop: horizontal 5-up, each step standalone. Mobile: stacks.
 */
export function HowItWorks({
  title = 'Cómo funciona Rezervame',
  subtitle = 'Descubre lo fácil que es reservar tus servicios favoritos en cuestión de segundos.',
  steps = STEPS,
  variant = 'light',
  compact = false,
  contentMax = 'var(--container-max)',
  style,
}) {
  const accent = variant === 'accent';
  const soft = variant === 'soft';
  const padY = compact ? 36 : 64;
  const bg = accent ? 'var(--rz-coral-050)' : soft ? 'var(--surface-section)' : 'var(--surface-card)';

  return (
    <section style={{
      background: bg,
      padding: `${padY}px 24px`, ...style,
    }}>
      <div style={{ width: contentMax, maxWidth: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: compact ? 28 : 44 }}>
          <h2 style={{ fontSize: 30, lineHeight: 1.15 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 15, color: 'var(--rz-gray-500)', marginTop: 8 }}>{subtitle}</p>}
        </div>

        <div className="rz-hiw-grid" style={{
          display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 20, position: 'relative',
        }}>
          {steps.map((s, i) => (
            <div key={i} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 8px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 76, height: 76, borderRadius: '50%',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--rz-coral)', boxShadow: '0 8px 22px rgba(2,48,71,0.10)',
                }}>
                  <Glyph name={s.icon} size={30} strokeWidth={2} />
                </div>
                <span style={{
                  position: 'absolute', top: -6, left: -6,
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--rz-navy-900)', color: '#fff',
                  fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--surface-card)',
                }}>{i + 1}</span>
              </div>
              <h4 style={{ fontSize: 18, fontWeight: 600, color: 'var(--rz-navy)', marginTop: 16 }}>{s.title}</h4>
              <p style={{ fontSize: 13.5, color: 'var(--rz-gray-600)', marginTop: 7, lineHeight: 1.5, maxWidth: 200 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: stack vertically, connector hidden */}
      <style>{`
        @media (max-width: 860px){
          .rz-hiw-grid{ grid-template-columns: 1fr !important; gap: 26px !important; max-width: 420px; margin: 0 auto; }
        }
      `}</style>
    </section>
  );
}
export default HowItWorks;
