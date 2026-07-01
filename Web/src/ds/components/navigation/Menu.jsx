import React from 'react';
import { Glyph } from '../core/Glyph.jsx';

/**
 * Anchored dropdown menu. Renders a trigger and, when open, a right-aligned
 * popover that closes on outside-click or Escape. Render-prop API:
 *   <Menu trigger={({ toggle }) => <Button onClick={toggle}/>}>
 *     {({ close }) => <MenuItem onClick={close}/>}
 *   </Menu>
 * Self-contained: ships its own entrance keyframe so it works on any page.
 */
export function Menu({ trigger, children, width = 220, align = 'right', style }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {trigger({ open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) })}
      {open && (
        <div role="menu" style={{
          position: 'absolute', top: 'calc(100% + 8px)', zIndex: 50, width,
          ...(align === 'left' ? { left: 0 } : { right: 0 }),
          background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-modal)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2,
          animation: 'rz-menu-pop 0.16s var(--ease-out)', ...style,
        }}>
          {children({ close: () => setOpen(false) })}
          <style>{'@keyframes rz-menu-pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'}</style>
        </div>
      )}
    </div>
  );
}

/**
 * A row inside a Menu: leading icon + label, full-width, ghost hover.
 * Optional: danger (red text + soft-coral hover), divider (top separator),
 * badge (trailing count pill). `size` picks one of two real menu specs:
 *   'sm' (default) — compact action menu (calendar / share rows).
 *   'md'           — taller navigation menu (header account menu).
 * Defaults reproduce the standard menu rows exactly.
 */
export function MenuItem({ icon, iconColor, children, onClick, danger = false, divider = false, badge, size = 'sm', style }) {
  const md = size === 'md';
  const color = danger ? 'var(--rz-coral)' : 'var(--rz-navy)';
  const ic = iconColor || (danger ? 'var(--rz-coral)' : (md ? 'var(--rz-gray-500)' : 'var(--rz-coral)'));
  const hoverBg = danger ? 'var(--rz-coral-050)' : (md ? 'var(--rz-gray-050)' : 'var(--rz-gray-100)');
  const baseRadius = md ? 'var(--radius-md)' : 'var(--radius-sm)';
  return (
    <button
      type="button" onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: md ? 12 : 10, width: '100%', textAlign: 'left',
        background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
        fontSize: md ? 14 : 13.5, fontWeight: md ? 500 : 600, color,
        padding: md ? '9.5px 12px' : '10px 12px', borderRadius: baseRadius,
        transition: 'background var(--dur-base)',
        ...(divider ? { marginTop: 6, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', borderRadius: 0 } : null),
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {icon && <Glyph name={icon} size={md ? 18 : 16} style={{ color: ic, flex: 'none' }} />}
      <span style={{ flex: 1 }}>{children}</span>
      {badge != null && (
        <span style={{ flex: 'none', fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--rz-coral)', borderRadius: 'var(--radius-pill)', padding: '1px 8px', minWidth: 20, textAlign: 'center' }}>{badge}</span>
      )}
    </button>
  );
}

export default Menu;
