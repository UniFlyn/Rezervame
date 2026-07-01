import React from 'react';
import { Glyph } from '../core/Glyph.jsx';

/**
 * Compact map control button (Rezervame).
 *  - variant 'solid'  : default map action; when `active` it fills Prussian navy
 *    with white text (the current/selected view).
 *  - variant 'outline': secondary action (e.g. "Ocultar mapa") — white with a
 *    1px border.
 * States: default · hover · active · disabled. Uses brand typography, the
 * --radius-md rounded-rectangle corner (NOT a pill) and the soft xs shadow.
 */
export function MapToggleButton({
  children, icon, variant = 'solid', active = false, disabled = false, onClick, style,
}) {
  const [hover, setHover] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const enter = () => { if (!disabled) setHover(true); };
    const leave = () => setHover(false);
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
    return () => { el.removeEventListener('mouseenter', enter); el.removeEventListener('mouseleave', leave); };
  }, [disabled]);

  let look;
  if (disabled) {
    look = { background: 'var(--action-disabled)', color: 'var(--rz-gray-500)', border: '1px solid var(--action-disabled)', boxShadow: 'none' };
  } else if (variant === 'outline') {
    look = active
      ? { background: 'var(--rz-navy-050)', color: 'var(--rz-navy)', border: '1px solid var(--rz-navy)' }
      : hover
        ? { background: 'var(--rz-gray-050)', color: 'var(--rz-navy)', border: '1px solid var(--border-default)' }
        : { background: 'var(--surface-card)', color: 'var(--rz-gray-700)', border: '1px solid var(--border-default)' };
  } else { // solid
    look = active
      ? { background: 'var(--rz-navy)', color: '#fff', border: '1px solid var(--rz-navy)' }
      : hover
        ? { background: 'var(--rz-gray-050)', color: 'var(--rz-navy)', border: '1px solid var(--border-subtle)' }
        : { background: 'var(--surface-card)', color: 'var(--rz-navy)', border: '1px solid var(--border-subtle)' };
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        height: 38, padding: '0 16px', borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, lineHeight: 1,
        cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
        boxShadow: disabled ? 'none' : 'var(--shadow-xs)',
        transition: 'background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)',
        ...look,
        ...style,
      }}
    >
      {icon && <Glyph name={icon} size={16} />}
      {children}
    </button>
  );
}
export default MapToggleButton;
