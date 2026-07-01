import React from 'react';
import { SearchBar } from '../core/SearchBar.jsx';
import { IconButton } from '../core/IconButton.jsx';
import { Avatar } from '../core/Avatar.jsx';
import { Button } from '../core/Button.jsx';
import { Glyph } from '../core/Glyph.jsx';
import { NotificationItem } from '../feedback/NotificationItem.jsx';
import { MenuItem } from './Menu.jsx';

/** Coral wordmark fallback when no logo image is supplied. */
function Wordmark({ height = 30 }) {
  return <span style={{ fontWeight: 700, fontSize: height, color: 'var(--rz-coral)', letterSpacing: '-0.02em' }}>rezervame</span>;
}

/**
 * Global customer header. Two variants:
 *  - "home": logo · search · (spacer) · "Iniciar sesión" — minimal, logged-out.
 *  - "business" (default): logo · search · business info · notifications ·
 *    favourites · user. Zones are evenly distributed with flexible spacers so
 *    the business info sits centrally and there's no awkward middle gap.
 */
export function Header({
  variant = 'business',
  logoSrc, showSearch = true,
  contextTitle, contextSubtitle,
  user, notifications = false,
  loginLabel = 'Iniciar sesión', onLogin,
  joinLabel = 'Unirse como negocio', onJoinBusiness,
  onLogoClick, sticky = false, onSearch, searchService, searchLocation, style,
  onNotifications, onFavorites, accountMenu, notificationItems, onSeeAllNotifications, onMarkAllRead,
}) {
  // Sticky search header: stays pinned on scroll, gains a soft shadow and
  // compacts slightly once the page is scrolled (Booksy-style). Single search
  // experience — the same header simply stays put, so no duplicate bars.
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sticky]);

  // ---- logged-in dropdowns (account menu + notifications panel) ----
  const [acctOpen, setAcctOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const rightRef = React.useRef(null);
  React.useEffect(() => {
    if (!acctOpen && !notifOpen) return;
    const onDoc = (e) => { if (rightRef.current && !rightRef.current.contains(e.target)) { setAcctOpen(false); setNotifOpen(false); } };
    const onEsc = (e) => { if (e.key === 'Escape') { setAcctOpen(false); setNotifOpen(false); } };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [acctOpen, notifOpen]);
  const hasNotifPanel = Array.isArray(notificationItems) && notificationItems.length > 0;
  // Local "marked all read" state so the prototype can clear unread dots/count.
  const [allRead, setAllRead] = React.useState(false);
  const isUnread = (n) => !allRead && n.unread;
  const unreadCount = hasNotifPanel ? notificationItems.filter(isUnread).length : 0;
  const bellBadge = hasNotifPanel ? (unreadCount > 0 ? unreadCount : false) : notifications;

  const Logo = (
    <a onClick={onLogoClick} style={{ flex: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
      {logoSrc ? <img src={logoSrc} alt="Rezervame" style={{ height: 30 }} /> : <Wordmark />}
    </a>
  );

  // Dynamic in-header title block (e.g. Search Results context). Sits to the
  // right of the search bar, before the user/login actions. Strong heading +
  // smaller secondary line; truncates rather than crowding the header.
  const ContextTitle = contextTitle ? (
    <div style={{ flex: '0 1 auto', minWidth: 0, textAlign: 'left', paddingLeft: 16, paddingRight: 'clamp(24px, 4vw, 56px)' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1.18, letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'clamp(160px, 24vw, 340px)' }}>{contextTitle}</div>
      {contextSubtitle && <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--rz-gray-500)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contextSubtitle}</div>}
    </div>
  ) : null;

  const shell = {
    display: 'flex', alignItems: 'center',
    height: sticky && scrolled ? 62 : 'var(--header-height)',
    padding: '0 32px',
    background: 'var(--surface-card)',
    borderBottom: '1px solid var(--border-subtle)',
    ...(sticky ? {
      position: 'sticky', top: 0, zIndex: 90,
      boxShadow: scrolled ? '0 6px 22px rgba(2,48,71,0.10)' : 'none',
      transition: 'height var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)',
    } : null),
    ...style,
  };

  // ---- HOME: logo · search · spacer · login ----
  if (variant === 'home') {
    return (
      <header style={shell}>
        {Logo}
        {showSearch && (
          <div style={{ flex: '0 1 620px', marginLeft: 40 }}>
            <SearchBar compact onSearch={onSearch} defaultService={searchService} defaultLocation={searchLocation} />
          </div>
        )}
        <div style={{ flex: 1 }} />
        {ContextTitle}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
          {onLogin && (
            <Button variant="primary" onClick={onLogin}>{loginLabel}</Button>
          )}
          {onJoinBusiness && (
            <Button variant="primary" onClick={onJoinBusiness}>{joinLabel}</Button>
          )}
        </div>
      </header>
    );
  }

  // ---- BUSINESS: logo · search · [spacer] · business info · [spacer] · right ----
  return (
    <header style={shell}>
      {Logo}

      {showSearch && (
        <div style={{ flex: '0 1 560px', marginLeft: 36 }}>
          <SearchBar compact onSearch={onSearch} defaultService={searchService} defaultLocation={searchLocation} />
        </div>
      )}

      <div style={{ flex: 1 }} />
      {ContextTitle}

      <div ref={rightRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
        <IconButton
          icon="bell" variant={notifOpen ? 'soft' : 'ghost'} round badge={bellBadge}
          label="Notificaciones"
          onClick={() => { if (hasNotifPanel) { setNotifOpen((o) => !o); setAcctOpen(false); } else if (onNotifications) onNotifications(); }}
        />
        <IconButton icon="heart" variant="ghost" round label="Favoritos" onClick={onFavorites} />
        {user && (
          <>
            <span style={{ width: 1, height: 34, background: 'var(--border-subtle)', margin: '0 10px' }} />
            {(() => {
              const cluster = (
                <>
                  <Avatar src={user.avatar} name={user.name} size={42} />
                  <div style={{ lineHeight: 1.2, marginLeft: 4, textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-navy)' }}>{user.name}</div>
                    {user.reservations != null && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rz-coral)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--rz-coral)' }} />
                        {user.reservations} RESERVAS
                      </div>
                    )}
                  </div>
                </>
              );
              if (!accountMenu) return <div style={{ display: 'flex', alignItems: 'center' }}>{cluster}</div>;
              return (
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={acctOpen}
                  onClick={() => { setAcctOpen((o) => !o); setNotifOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px 4px 4px',
                    background: acctOpen ? 'var(--rz-gray-050)' : 'transparent', border: '1px solid transparent',
                    borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    transition: 'background var(--dur-base) var(--ease-standard)',
                  }}
                  onMouseEnter={(e) => { if (!acctOpen) e.currentTarget.style.background = 'var(--rz-gray-050)'; }}
                  onMouseLeave={(e) => { if (!acctOpen) e.currentTarget.style.background = 'transparent'; }}
                >
                  {cluster}
                  <span style={{ display: 'inline-flex', color: 'var(--rz-gray-500)', marginLeft: 2, transition: 'transform var(--dur-base) var(--ease-standard)', transform: acctOpen ? 'rotate(180deg)' : 'none' }}>
                    <Glyph name="chevronDown" size={18} />
                  </span>
                </button>
              );
            })()}
          </>
        )}

        {/* Notifications panel */}
        {hasNotifPanel && notifOpen && (
          <div role="menu" style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 380, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 95 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 18px 14px' }}>
              <span style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: '-0.2px' }}>Notificaciones</span>
              {unreadCount > 0 && (
                <span style={{ flex: 'none', fontSize: 11, fontWeight: 700, color: 'var(--rz-coral)', background: 'var(--rz-coral-050)', borderRadius: 'var(--radius-pill)', padding: '2px 8px' }}>{unreadCount} nuevas</span>
              )}
            </div>
            <div style={{ height: 1, background: 'var(--border-subtle)' }} />
            <div style={{ maxHeight: 372, overflowY: 'auto', padding: '6px' }}>
              {notificationItems.map((n, i) => (
                <NotificationItem
                  key={i} variant="compact"
                  icon={n.icon} title={n.title} time={n.time} unread={isUnread(n)}
                  onClick={() => { setNotifOpen(false); if (n.onClick) n.onClick(); }}
                />
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
              <button type="button" onClick={(e) => { e.stopPropagation(); setAllRead(true); if (onMarkAllRead) onMarkAllRead(); }} disabled={unreadCount === 0} style={{ flex: 1, padding: '9px 12px', background: 'transparent', border: 'none', borderRadius: 'var(--radius-md)', cursor: unreadCount === 0 ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: unreadCount === 0 ? 'var(--rz-gray-400)' : 'var(--rz-navy)', textAlign: 'center', transition: 'background var(--dur-fast) var(--ease-standard)' }}
              onMouseEnter={(e) => { if (unreadCount > 0) e.currentTarget.style.background = 'var(--rz-gray-050)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                Marcar todas como leídas
              </button>
              <span style={{ width: 1, height: 22, background: 'var(--border-subtle)', flex: 'none' }} />
              <button type="button" onClick={() => { setNotifOpen(false); if (onSeeAllNotifications) onSeeAllNotifications(); }} style={{ flex: 1, padding: '9px 12px', background: 'transparent', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: 'var(--rz-coral)', textAlign: 'center', transition: 'background var(--dur-fast) var(--ease-standard)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rz-gray-050)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                Ver todas
              </button>
            </div>
          </div>
        )}

        {/* Account menu */}
        {accountMenu && acctOpen && (
          <div role="menu" style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 266, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 95, padding: 6 }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px 14px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
                <Avatar src={user.avatar} name={user.name} size={44} />
                <div style={{ minWidth: 0, lineHeight: 1.25 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--rz-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                  {user.email && <div style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>}
                  {user.reservations != null && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 7, fontSize: 11.5, fontWeight: 700, color: 'var(--rz-coral)', background: 'var(--rz-coral-050)', borderRadius: 'var(--radius-pill)', padding: '2px 9px' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--rz-coral)' }} />
                      {user.reservations} reservas
                    </div>
                  )}
                </div>
              </div>
            )}
            {accountMenu.map((m, i) => (
              <MenuItem
                key={i} size="md"
                icon={m.icon} danger={m.danger} divider={m.divider} badge={m.badge}
                onClick={() => { setAcctOpen(false); if (m.onClick) m.onClick(); }}
              >
                {m.label}
              </MenuItem>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
export default Header;
