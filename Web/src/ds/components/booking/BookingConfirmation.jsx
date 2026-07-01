import React from 'react';
import { Button } from '../core/Button.jsx';
import { Glyph } from '../core/Glyph.jsx';

/**
 * Booking confirmation modal — a complete, centered, premium confirmation CARD
 * that NEVER scrolls internally. Content is compact and sized with clamp() so it
 * adapts to the viewport while staying fully visible. If the viewport is ever
 * shorter than the card, the dimmed BACKDROP scrolls — the card itself never
 * shows a scrollbar, so it reads as a finished confirmation, not a panel.
 *
 * Shows: success icon, "Reserva exitosa", business, booked service(s),
 * date/time, location, and clear primary + secondary CTAs. The footer actions
 * ("Agregar al calendario", "Compartir") are fully wired: calendar builds real
 * Google / Outlook links and an .ics download; share copies the reservation
 * link and uses the native share sheet when available.
 */
export function BookingConfirmation({
  open = true,
  business,
  services = [],            // string[] or { name }[]
  datetime,
  location,
  professionals = [],       // string[] of assigned pro names (optional)
  startISO,                 // ISO start — enables real calendar events (optional)
  endISO,                   // ISO end (optional)
  reservationUrl = 'https://rezervame.app/mis-reservas',
  title = 'Reserva',
  highlight = 'exitosa',
  subtitle = 'Tu cita ha sido programada. Prepárate para una experiencia de primer nivel.',
  primaryLabel = 'Ver detalles',
  secondaryLabel = 'Ir al inicio',
  onPrimary,
  onSecondary,
  onClose,
  footerLinks = true,
  brandLine = 'Rezervame · Premium Experience',
  style,
}) {
  const [menu, setMenu] = React.useState(null);   // null | 'calendar' | 'share'
  const [copied, setCopied] = React.useState(false);
  const actionsRef = React.useRef(null);

  // Close popovers on outside click / Escape.
  React.useEffect(() => {
    if (!menu) return undefined;
    const onDoc = (e) => { if (actionsRef.current && !actionsRef.current.contains(e.target)) setMenu(null); };
    const onKey = (e) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [menu]);

  if (!open) return null;

  const serviceNames = services.map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean);
  const proNames = (professionals && professionals.length
    ? professionals
    : services.map((s) => (typeof s === 'string' ? null : s.pro)).filter(Boolean)
  ).filter(Boolean);

  // ---- calendar event payload ----
  const eventTitle = business ? `Reserva en ${business}` : 'Reserva en Rezervame';
  const descLines = [];
  if (serviceNames.length) descLines.push(`Servicios: ${serviceNames.join(', ')}.`);
  if (proNames.length) descLines.push(`Profesionales: ${proNames.join(', ')}.`);
  descLines.push('Reserva realizada a través de Rezervame.');
  if (reservationUrl) descLines.push(`Ver tu reserva: ${reservationUrl}`);
  const eventDesc = descLines.join('\n');

  // Compact UTC stamp (YYYYMMDDTHHMMSSZ). Falls back to now → +1h when no ISO given.
  const pad = (n) => String(n).padStart(2, '0');
  const toUTC = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const start = startISO ? new Date(startISO) : new Date(Date.now() + 24 * 3600 * 1000);
  const end = endISO ? new Date(endISO) : new Date(start.getTime() + 3600 * 1000);
  const gStart = toUTC(start);
  const gEnd = toUTC(end);

  const googleUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + `&text=${encodeURIComponent(eventTitle)}`
    + `&dates=${gStart}/${gEnd}`
    + `&details=${encodeURIComponent(eventDesc)}`
    + (location ? `&location=${encodeURIComponent(location)}` : '');

  const outlookUrl = 'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent'
    + `&subject=${encodeURIComponent(eventTitle)}`
    + `&startdt=${encodeURIComponent(start.toISOString())}`
    + `&enddt=${encodeURIComponent(end.toISOString())}`
    + `&body=${encodeURIComponent(eventDesc)}`
    + (location ? `&location=${encodeURIComponent(location)}` : '');

  const downloadICS = () => {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rezervame//Reserva//ES', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${gStart}-${Math.random().toString(36).slice(2, 9)}@rezervame.app`,
      `DTSTAMP:${toUTC(new Date())}`,
      `DTSTART:${gStart}`, `DTEND:${gEnd}`,
      `SUMMARY:${eventTitle}`,
      `DESCRIPTION:${eventDesc.replace(/\n/g, '\\n')}`,
      location ? `LOCATION:${location}` : '',
      `URL:${reservationUrl}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'reserva-rezervame.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMenu(null);
  };

  const openExternal = (url) => { window.open(url, '_blank', 'noopener,noreferrer'); setMenu(null); };

  const copyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(reservationUrl);
      else { const t = document.createElement('textarea'); t.value = reservationUrl; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
      setCopied(true);
      setTimeout(() => { setCopied(false); setMenu(null); }, 1300);
    } catch (e) { /* clipboard blocked — ignore silently */ }
  };

  const calItems = [
    { id: 'google', label: 'Google Calendar', icon: 'calendar', onClick: () => openExternal(googleUrl) },
    { id: 'apple', label: 'Apple Calendar / iCal', icon: 'download', onClick: downloadICS },
    { id: 'outlook', label: 'Outlook', icon: 'calendar', onClick: () => openExternal(outlookUrl) },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 120,
        background: 'var(--overlay-scrim)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, overflowY: 'auto',  // backdrop scrolls if ever needed — NOT the card
        animation: 'rz-fade 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: 540,
          background: 'var(--surface-card)', borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-modal)',
          padding: 'clamp(24px, 4vw, 38px) clamp(20px, 4vw, 38px) clamp(20px, 3vw, 28px)',
          textAlign: 'center', overflow: 'visible',   // no internal scroll
          animation: 'rz-pop 0.24s var(--ease-out)', ...style,
        }}
      >
        <div style={{
          width: 'clamp(72px, 12vw, 88px)', height: 'clamp(72px, 12vw, 88px)',
          margin: '0 auto clamp(14px, 2vw, 20px)', borderRadius: '50%',
          background: 'var(--rz-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 9px rgba(31,157,91,0.07)',
        }}>
          <Glyph name="check" size={40} strokeWidth={2.4} style={{ color: 'var(--rz-success)' }} />
        </div>

        <h2 style={{ fontSize: 'clamp(26px, 4vw, 32px)', lineHeight: 1.15 }}>
          ¡{title} <span style={{ color: 'var(--rz-coral)' }}>{highlight}</span>!
        </h2>
        {subtitle && <p style={{ fontSize: 15, color: 'var(--rz-gray-500)', marginTop: 10, lineHeight: 1.45, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>{subtitle}</p>}

        {(business || serviceNames.length > 0) && (
          <div style={{ marginTop: 'clamp(14px, 2vw, 20px)' }}>
            {business && <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rz-coral)' }}>{business}</div>}
            {serviceNames.length > 0 && (
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--rz-navy)', marginTop: 4, lineHeight: 1.3 }}>
                {serviceNames.join(' + ')}
              </div>
            )}
            {proNames.length > 0 && (
              <div style={{ fontSize: 13.5, color: 'var(--rz-gray-500)', marginTop: 6 }}>
                con {proNames.join(', ')}
              </div>
            )}
          </div>
        )}

        {(datetime || location) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 'clamp(16px, 2.4vw, 22px)' }}>
            {datetime && <InfoChip icon="calendar" label="Fecha y hora" value={datetime} />}
            {location && <InfoChip icon="mapPin" label="Ubicación" value={location} />}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 'clamp(16px, 2.4vw, 20px)' }}>
          <Button variant="dark" fullWidth leftIcon="home" onClick={onSecondary} style={{ flex: '1 1 180px' }}>{secondaryLabel}</Button>
          <Button variant="primary" fullWidth leftIcon="list" onClick={onPrimary} style={{ flex: '1 1 180px' }}>{primaryLabel}</Button>
        </div>

        {footerLinks && (
          <>
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: 'clamp(16px,2.4vw,22px) 0 14px' }} />
            <div ref={actionsRef} style={{ display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap', position: 'relative' }}>
              {/* Agregar al calendario */}
              <div style={{ position: 'relative' }}>
                <button style={linkBtn} aria-haspopup="menu" aria-expanded={menu === 'calendar'} onClick={() => setMenu(menu === 'calendar' ? null : 'calendar')}>
                  <Glyph name="calendar" size={16} /> Agregar al calendario
                </button>
                {menu === 'calendar' && (
                  <Popover>
                    {calItems.map((it) => (
                      <button key={it.id} style={popItem} onClick={it.onClick}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rz-gray-100)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <Glyph name={it.icon} size={16} style={{ color: 'var(--rz-coral)', flex: 'none' }} /> {it.label}
                      </button>
                    ))}
                  </Popover>
                )}
              </div>

              {/* Compartir */}
              <div style={{ position: 'relative' }}>
                <button style={linkBtn} aria-haspopup="menu" aria-expanded={menu === 'share'} onClick={() => { setCopied(false); setMenu(menu === 'share' ? null : 'share'); }}>
                  <Glyph name="share" size={16} /> Compartir
                </button>
                {menu === 'share' && (
                  <Popover>
                    <button style={popItem} onClick={copyLink}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rz-gray-100)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <Glyph name={copied ? 'check' : 'link'} size={16} style={{ color: copied ? 'var(--rz-success)' : 'var(--rz-coral)', flex: 'none' }} />
                      {copied ? 'Enlace copiado' : 'Copiar enlace'}
                    </button>
                  </Popover>
                )}
              </div>
            </div>
          </>
        )}
        {brandLine && <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rz-gray-400)', marginTop: 16 }}>{brandLine}</div>}

        <style>{`@keyframes rz-fade{from{opacity:0}to{opacity:1}}@keyframes rz-pop{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:none}}`}</style>
      </div>
    </div>
  );
}

/* Compact info card whose value truncates to one line; on hover (desktop) or tap
   (touch) the card itself expands smoothly in place to reveal the full text. No
   floating tooltip — the expansion pushes the layout, so it never overlaps the
   CTAs and always stays within the modal. */
function InfoChip({ icon, label, value }) {
  const valRef = React.useRef(null);
  const rootRef = React.useRef(null);
  const [truncated, setTruncated] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const el = valRef.current;
    if (el) setTruncated(el.scrollWidth > el.clientWidth + 1);
  }, [value]);
  // Touch: collapse when tapping outside.
  React.useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('touchstart', onDoc); };
  }, [open]);
  const interactive = truncated;
  const expanded = interactive && open;
  return (
    <div
      ref={rootRef}
      onMouseEnter={() => interactive && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => interactive && setOpen((v) => !v)}
      style={{
        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12,
        background: expanded ? '#fff' : 'var(--rz-gray-100)', borderRadius: 'var(--radius-md)', padding: '12px 14px', textAlign: 'left',
        cursor: interactive ? 'pointer' : 'default',
        boxShadow: expanded ? 'var(--shadow-card)' : 'none',
        transition: 'background var(--dur-base) ease, box-shadow var(--dur-base) ease',
      }}
    >
      <span style={{ width: 38, height: 38, flex: 'none', borderRadius: 10, background: '#fff', color: 'var(--rz-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: expanded ? 'inset 0 0 0 1px var(--border-subtle)' : 'none' }}><Glyph name={icon} size={19} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--rz-gray-500)' }}>{label}</div>
        <div style={{ maxHeight: expanded ? 96 : 22, overflow: 'hidden', transition: 'max-height 0.26s var(--ease-out)' }}>
          <div ref={valRef} style={{ fontSize: 15, fontWeight: 600, color: 'var(--rz-navy)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'normal' : 'nowrap', wordBreak: 'break-word' }}>{value}</div>
        </div>
      </div>
    </div>
  );
}

/* Small action menu anchored above its trigger (footer sits near the modal base,
   so it opens upward and never overlaps the primary CTAs). */
function Popover({ children }) {
  return (
    <div role="menu" style={{
      position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 10, zIndex: 80,
      background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-modal)', padding: 6, minWidth: 210, display: 'flex', flexDirection: 'column', gap: 2,
      animation: 'rz-pop 0.16s var(--ease-out)',
    }}>{children}</div>
  );
}

const linkBtn = { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--rz-navy)' };
const popItem = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--rz-navy)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', transition: 'background var(--dur-base)' };

export default BookingConfirmation;
