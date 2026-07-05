import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
import { Button } from '../core/Button.jsx';
import { SocialLinks } from '../core/SocialLinks.jsx';

function normalizeLink(l) {
  if (typeof l === 'string') return { label: l, href: '#', external: false };
  return {
    label: l.label,
    href: l.href || '#',
    external: Boolean(l.external),
  };
}

/**
 * Coral footer with logo, tagline, link columns, social circles and
 * app-store download buttons. Matches the Rezervame brand footer.
 */
export function Footer({
  logoSrc, tagline = 'La principal plataforma de reservas de belleza y bienestar. Conéctate con los mejores profesionales de tu zona.',
  columns = [], socials = ['instagram', 'facebook', 'linkedin', 'x'], socialItems,
  downloadTitle = 'Descarga la aplicación REZERVAME', downloadSubtitle = 'Reserva citas estés donde estés',
  appStoreHref, playStoreHref,
  contentMax = 'min(88%, 1400px)',
  style,
}) {
  const socialRow = socialItems && socialItems.length > 0 ? socialItems : socials;

  return (
    <footer style={{ background: 'var(--rz-coral)', color: '#fff', padding: '32px clamp(20px, 4vw, 56px) 20px', ...style }}>
      <div style={{ width: contentMax, maxWidth: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 340px', maxWidth: 420 }}>
            {logoSrc
              ? <img src={logoSrc} alt="Rezervame" style={{ height: 28, marginBottom: 10 }} />
              : <div style={{ fontWeight: 700, fontSize: 26, marginBottom: 10 }}>rezervame</div>}
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.92)' }}>{tagline}</p>
            <div style={{ marginTop: 12 }}>
              <SocialLinks items={socialRow} variant="footer" size={40} gap={10} />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(40px, 4vw, 72px)' }}>
          {columns.map((col) => (
            <div key={col.title} style={{ flex: '0 0 auto' }}>
              <h5 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{col.title}</h5>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {col.links.map((l) => {
                  const item = normalizeLink(l);
                  return (
                    <li key={`${col.title}-${item.label}`}>
                      <a
                        style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}
                        href={item.href}
                        {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.25)', margin: '20px 0 16px' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{downloadTitle}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>{downloadSubtitle}</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <a
              href={appStoreHref || '#'}
              {...(/^https?:\/\//i.test(appStoreHref || '') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              style={{ textDecoration: 'none' }}
            >
              <Button variant="dark" shape="rounded" size="sm" type="button">App Store</Button>
            </a>
            <a
              href={playStoreHref || '#'}
              {...(/^https?:\/\//i.test(playStoreHref || '') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              style={{ textDecoration: 'none' }}
            >
              <Button variant="dark" shape="rounded" size="sm" type="button">Google Play</Button>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
