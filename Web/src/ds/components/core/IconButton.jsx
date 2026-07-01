import React from 'react';
import { Glyph } from './Glyph.jsx';

/**
 * Rezervame IconButton — standardized icon-only action.
 *
 * Container:  sm 32 · md 40 (default) · lg 48 (min 40px hit area for touch).
 * Icon:       sm 17 · md 20 · lg 24 — optically centered, consistent 2px stroke,
 *             larger visual weight inside the hit area, never cropped on hover.
 * variant:    neutral (default) | outline | filled | dark | soft | outlineNeutral | ghost
 * selected:   coral fill + white icon (active/selected state, any variant)
 * round:      circle (999px) for quick actions (favorite, share, notify, …)
 */
export function IconButton({
  icon,
  variant = 'neutral',
  size = 'md',
  round = false,
  selected = false,
  badge = false,
  badgeCount,
  disabled = false,
  label,
  style,
  ...rest
}) {
  const SIZES = {
    sm: { box: 32, icon: 17, stroke: 2 },
    md: { box: 40, icon: 20, stroke: 2 },
    lg: { box: 48, icon: 24, stroke: 2 },
  };
  const s = SIZES[size] || SIZES.md;

  const CORAL = 'var(--rz-coral)';
  const NAVY = 'var(--rz-navy)';

  // base / hover looks per variant. `selected` and `disabled` override below.
  const VARIANTS = {
    // Neutral default — transparent, navy icon; soft neutral wash on hover.
    neutral: {
      base:  { background: 'transparent', color: NAVY, border: '1px solid transparent' },
      hover: { background: 'var(--rz-gray-050)', color: NAVY, border: '1px solid transparent' },
    },
    // Outline brand — white, coral border + icon; fills coral on hover.
    outline: {
      base:  { background: 'var(--surface-card)', color: CORAL, border: `1.5px solid ${CORAL}` },
      hover: { background: CORAL, color: '#fff', border: `1.5px solid ${CORAL}` },
    },
    // Filled brand — coral, white icon.
    filled: {
      base:  { background: CORAL, color: '#fff', border: '1px solid transparent' },
      hover: { background: 'var(--rz-coral-600)', color: '#fff', border: '1px solid transparent' },
    },
    // Dark filled — navy, white icon.
    dark: {
      base:  { background: NAVY, color: '#fff', border: '1px solid transparent' },
      hover: { background: 'var(--rz-navy-800)', color: '#fff', border: '1px solid transparent' },
    },
    // Soft — gray fill, navy icon (in-row / toolbar). Coral wash on hover.
    soft: {
      base:  { background: 'var(--rz-gray-100)', color: NAVY, border: '1px solid transparent' },
      hover: { background: 'var(--rz-coral-050)', color: CORAL, border: '1px solid transparent' },
    },
    // Outline neutral — white, neutral border, muted icon (print/share rows).
    outlineNeutral: {
      base:  { background: 'var(--surface-card)', color: 'var(--rz-gray-600)', border: '1px solid var(--border-default)' },
      hover: { background: 'var(--rz-gray-050)', color: NAVY, border: '1px solid var(--border-default)' },
    },
    // Ghost — transparent, navy icon, faint navy wash.
    ghost: {
      base:  { background: 'transparent', color: NAVY, border: '1px solid transparent' },
      hover: { background: 'var(--rz-navy-050)', color: NAVY, border: '1px solid transparent' },
    },
  };
  const v = VARIANTS[variant] || VARIANTS.neutral;

  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const enter = () => { if (!disabled) setHovered(true); };
    const leave = () => { setHovered(false); setPressed(false); };
    const down = () => { if (!disabled) setPressed(true); };
    const up = () => setPressed(false);
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
    el.addEventListener('mousedown', down);
    el.addEventListener('mouseup', up);
    el.addEventListener('blur', leave);
    return () => {
      el.removeEventListener('mouseenter', enter);
      el.removeEventListener('mouseleave', leave);
      el.removeEventListener('mousedown', down);
      el.removeEventListener('mouseup', up);
      el.removeEventListener('blur', leave);
    };
  }, [disabled]);

  const selectedLook = { background: CORAL, color: '#fff', border: `1.5px solid ${CORAL}` };
  const selectedHover = { background: 'var(--rz-coral-600)', color: '#fff', border: '1.5px solid var(--rz-coral-600)' };
  const disabledLook = {
    background: 'var(--rz-gray-100)',
    color: 'var(--rz-gray-400)',
    border: '1px solid var(--border-subtle)',
  };

  let look;
  if (disabled) look = disabledLook;
  else if (selected) look = hovered ? selectedHover : selectedLook;
  else look = hovered ? v.hover : v.base;

  return (
    <button
      ref={ref}
      aria-label={label}
      aria-pressed={selected || undefined}
      title={label}
      disabled={disabled}
      style={{
        position: 'relative',
        flex: 'none',
        width: s.box, height: s.box,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
        borderRadius: round ? 'var(--radius-pill)' : 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transform: !disabled && pressed ? 'scale(0.92)' : 'none',
        transition: 'background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)',
        ...look,
        ...style,
      }}
      {...rest}
    >
      {typeof icon === 'string'
        ? <Glyph name={icon} size={s.icon} strokeWidth={s.stroke} />
        : icon}
      {(badge || badgeCount != null) && (
        <span style={{
          position: 'absolute',
          top: round ? '4%' : -4,
          right: round ? '4%' : -4,
          minWidth: badgeCount != null ? 17 : 10,
          height: badgeCount != null ? 17 : 10,
          padding: badgeCount != null ? '0 4px' : 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--rz-coral)', color: '#fff',
          fontSize: 10.5, fontWeight: 700, lineHeight: 1,
          border: '2px solid #fff',
          boxSizing: 'border-box',
        }}>{badgeCount != null ? badgeCount : null}</span>
      )}
    </button>
  );
}
export default IconButton;
