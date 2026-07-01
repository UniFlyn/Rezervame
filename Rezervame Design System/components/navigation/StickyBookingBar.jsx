import React from 'react';
import { Button } from '../core/Button.jsx';
import { Avatar } from '../core/Avatar.jsx';
import { Glyph } from '../core/Glyph.jsx';

/**
 * Business / Venue sticky booking bar ("Reservar Ahora").
 *
 * Booksy-style behaviour: hidden at the top of the venue page, slides down +
 * fades in once the user scrolls past the business header, retracts when they
 * scroll back up. Drive it one of two ways:
 *  - controlled: pass `visible` (and optionally manage it yourself), or
 *  - automatic: pass `watchRef` (a ref to the on-page business header). The bar
 *    shows whenever that element has scrolled above the top of the viewport.
 * In a static card/preview just pass `visible` and `static`.
 */
export function StickyBookingBar({
  name, location, avatar,
  ctaLabel = 'Reservar Ahora', onReserve,
  visible: visibleProp, watchRef,
  static: isStatic = false,
  style,
}) {
  const [autoVisible, setAutoVisible] = React.useState(false);

  React.useEffect(() => {
    if (visibleProp != null || isStatic) return;
    const onScroll = () => {
      const el = watchRef && watchRef.current;
      const threshold = el ? el.getBoundingClientRect().bottom : 320;
      setAutoVisible(threshold < 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [visibleProp, watchRef, isStatic]);

  const visible = visibleProp != null ? visibleProp : autoVisible;

  return (
    <div
      style={{
        position: isStatic ? 'relative' : 'fixed',
        top: 0, left: 0, right: 0, zIndex: 90,
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: '0 6px 20px rgba(2,48,71,0.10)',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'transform var(--dur-slow) var(--ease-out), opacity var(--dur-base) var(--ease-standard)',
        ...style,
      }}
    >
      <div style={{
        maxWidth: 'var(--container-max)', margin: '0 auto',
        height: 70, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {(avatar !== undefined) && <Avatar src={avatar} name={name} size={44} style={{ flex: 'none' }} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--rz-navy)', lineHeight: 1.2, letterSpacing: '-0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            {location && (
              <div className="rz-sticky-loc" style={{ fontSize: 13, color: 'var(--rz-gray-500)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5, lineHeight: 1.2 }}>
                <Glyph name="mapPin" size={13} style={{ color: 'var(--rz-gray-400)', flex: 'none' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location}</span>
              </div>
            )}
          </div>
        </div>
        <Button variant="primary" onClick={onReserve} style={{ flex: 'none' }}>{ctaLabel}</Button>
      </div>
      {/* Hide the location line on very narrow screens */}
      <style>{`@media (max-width: 560px){.rz-sticky-loc{display:none !important}}`}</style>
    </div>
  );
}
export default StickyBookingBar;
