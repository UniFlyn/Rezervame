import React from 'react';
import { Glyph } from '../core/Glyph.jsx';
import { IconButton } from '../core/IconButton.jsx';
import { SocialIconButton } from '../core/SocialIconButton.jsx';

const Label = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--rz-gray-500)', marginBottom: 10 }}>{children}</div>
);
const Divider = () => <div style={{ height: 1, background: 'var(--border-subtle)', margin: '18px 0' }} />;

/**
 * Venue sidebar info panel — optional map, business name, about, hours,
 * contact, social links and footer links.
 */
export function BusinessInfoPanel({
  name, mapImage, mapNode, address, about, todayLabel = 'Hoy', todayHours,
  weekHours = [], phone, email, socials = [], links = [], onLinkClick, onDirections, style,
}) {
  const [weekOpen, setWeekOpen] = React.useState(false);
  const triggerStyle = { display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--rz-coral)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)' };
  return (
    <div style={{
      background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', ...style,
    }}>
      {(mapNode || mapImage) && (
        <div style={{ height: 160, background: 'var(--rz-gray-100)', overflow: 'hidden', position: 'relative' }}>
          {mapNode ? mapNode : <img src={mapImage} alt="map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
      )}
      <div style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: 'var(--rz-navy)' }}>{name}</h4>
            {address && <p style={{ fontSize: 13, color: 'var(--rz-gray-500)', marginTop: 4, lineHeight: 1.4 }}>{address}</p>}
          </div>
          <IconButton icon="send" variant="outline" round size="sm" onClick={onDirections} label="Cómo llegar en Google Maps" />
        </div>

        {about && (<><Divider /><Label>Sobre nosotros</Label>
          <p style={{ fontSize: 13, color: 'var(--rz-gray-600)', lineHeight: 1.5 }}>{about}</p></>)}

        {todayHours && (<><Divider /><Label>Horario</Label>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ fontWeight: 600, color: 'var(--rz-navy)' }}>{todayLabel}</span>
            <span style={{ color: 'var(--rz-gray-700)' }}>{todayHours}</span>
          </div>
          {weekHours.length > 0 ? (<>
            <button onClick={() => setWeekOpen((o) => !o)} style={triggerStyle} aria-expanded={weekOpen}>
              {weekOpen ? 'Ocultar horario semanal' : 'Ver semana completa'}
              <Glyph name="chevronDown" size={14} style={{ transform: weekOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-base) var(--ease-standard)' }} />
            </button>
            <div style={{ display: 'grid', gridTemplateRows: weekOpen ? '1fr' : '0fr', transition: 'grid-template-rows var(--dur-slow) var(--ease-standard)' }}>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {weekHours.map((w, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                      <span style={{ color: 'var(--rz-gray-600)' }}>{w.day}</span>
                      <span style={{ color: /cerrado/i.test(w.hours) ? 'var(--rz-gray-400)' : 'var(--rz-gray-700)', fontWeight: 500 }}>{w.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>) : (
            <button style={triggerStyle}>Ver semana completa <Glyph name="chevronDown" size={14} /></button>
          )}</>)}

        {(phone || email) && (<><Divider /><Label>Contacto</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {phone && <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--rz-gray-700)' }}><Glyph name="phone" size={16} style={{ color: 'var(--rz-coral)' }} />{phone}</span>}
            {email && <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--rz-gray-700)' }}><Glyph name="mail" size={16} style={{ color: 'var(--rz-coral)' }} />{email}</span>}
          </div></>)}

        {socials.length > 0 && (<><Divider />
          <div style={{ textAlign: 'center' }}>
            <Label>Redes sociales</Label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {socials.map((s, i) => {
                const name = typeof s === 'string' ? s : (s.name || s.icon);
                return <SocialIconButton key={i} name={name} href={s && s.href} variant="coral" size={40} />;
              })}
            </div>
          </div></>)}

        {links.length > 0 && (<><Divider />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {links.map((l, i) => (
              <button key={i} onClick={() => onLinkClick && onLinkClick(l, i)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', background: 'none', border: 'none', borderTop: i ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--rz-gray-700)', textAlign: 'left', transition: 'color var(--dur-base)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rz-coral)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--rz-gray-700)'; }}>
                {l} <Glyph name="chevronRight" size={16} style={{ color: 'var(--rz-gray-400)' }} />
              </button>
            ))}
          </div></>)}
      </div>
    </div>
  );
}
export default BusinessInfoPanel;
