import React from 'react';
import { Glyph } from './Glyph.jsx';

/**
 * Rezervame Button.
 * variant: primary (coral), dark (navy), outline (coral border), ghost, soft (coral tint)
 * size: sm | md | lg ; shape: pill | rounded
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  fullWidth = false,
  uppercase = false,
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  style,
  ...rest
}) {
  const sizes = {
    sm: { h: 36, px: 16, fs: 13, gap: 6, icon: 15, radius: 'var(--radius-btn-sm)' }, // 10px
    md: { h: 46, px: 22, fs: 14, gap: 8, icon: 18, radius: 'var(--radius-md)' },     // 12px
    lg: { h: 54, px: 30, fs: 16, gap: 10, icon: 20, radius: 'var(--radius-btn-lg)' },// 14px
  };
  const s = sizes[size] || sizes.md;

  // Each variant declares its resting (base), hover and pressed/active looks.
  // Booking CTAs (primary + outline) all resolve to filled brand red with
  // white text on hover, and a darker red when pressed/active.
  // Borders are a crisp 1px; shadows are subtle (no neon glow).
  const CORAL = 'var(--rz-coral)';        // #FF5757 — official accent
  const CORAL_HOVER = 'var(--rz-coral-600)'; // #F04646
  const CORAL_PRESS = 'var(--rz-coral-700)'; // #D83B3B
  const variants = {
    primary: {
      base:  { background: CORAL, color: '#fff', border: `1px solid ${CORAL}`, boxShadow: 'var(--shadow-coral)' },
      hover: { background: CORAL_HOVER, color: '#fff', border: `1px solid ${CORAL_HOVER}`, boxShadow: 'var(--shadow-coral-hover)' },
      active:{ background: CORAL_PRESS, color: '#fff', border: `1px solid ${CORAL_PRESS}`, boxShadow: 'var(--shadow-coral-press)' },
    },
    dark: {
      base:  { background: 'var(--action-dark)', color: '#fff', border: '1px solid var(--action-dark)', boxShadow: '0 6px 16px rgba(2,48,71,0.18)' },
      hover: { background: 'var(--action-dark-hover)', color: '#fff', border: '1px solid var(--action-dark-hover)', boxShadow: '0 8px 18px rgba(2,48,71,0.20)' },
      active:{ background: 'var(--rz-navy-900)', color: '#fff', border: '1px solid var(--rz-navy-900)', boxShadow: '0 3px 9px rgba(2,48,71,0.18)' },
    },
    // OUTLINE CTA — white at rest, FILLS solid brand red with white text on
    // hover, darker red when pressed. Used by all booking actions
    // (Rezervame, Ver disponibilidad, Reservar ahora, Continuar, Pagar…).
    outline: {
      base:  { background: 'var(--surface-card)', color: CORAL, border: `1px solid ${CORAL}`, boxShadow: 'none' },
      hover: { background: CORAL, color: '#fff', border: `1px solid ${CORAL}`, boxShadow: 'var(--shadow-coral)' },
      active:{ background: CORAL_PRESS, color: '#fff', border: `1px solid ${CORAL_PRESS}`, boxShadow: 'var(--shadow-coral-press)' },
    },
    // SOFT — coral tint. For chips, filters, badges & LOW-EMPHASIS secondary
    // actions only (e.g. "Promociones"). NOT for main booking CTAs — use
    // `primary` or `outline` for those.
    soft: {
      base:  { background: 'var(--rz-coral-100)', color: 'var(--rz-coral-700)', border: '1px solid transparent', boxShadow: 'none' },
      hover: { background: CORAL, color: '#fff', border: `1px solid ${CORAL}`, boxShadow: 'none' },
      active:{ background: CORAL_PRESS, color: '#fff', border: `1px solid ${CORAL_PRESS}`, boxShadow: 'none' },
    },
    ghost: {
      base:  { background: 'transparent', color: 'var(--rz-navy)', border: '1px solid transparent', boxShadow: 'none' },
      hover: { background: 'var(--rz-navy-050)', color: 'var(--rz-navy)', border: '1px solid transparent', boxShadow: 'none' },
      active:{ background: 'var(--rz-navy-100)', color: 'var(--rz-navy)', border: '1px solid transparent', boxShadow: 'none' },
    },
  };
  const vs = variants[variant] || variants.primary;

  const isDisabled = disabled || loading;
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const ref = React.useRef(null);

  // Native listeners (robust across event systems; fire on real hover/press).
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const enter = () => { if (!isDisabled) setHovered(true); };
    const leave = () => { setHovered(false); setPressed(false); };
    const down = () => { if (!isDisabled) setPressed(true); };
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
  }, [isDisabled]);

  const disabledLook = {
    background: 'var(--action-disabled)',      // neutral-200
    color: 'var(--rz-gray-500)',               // neutral-500 — clearly disabled but clean
    border: '1px solid var(--action-disabled)',
    boxShadow: 'none',
  };
  const stateLook = isDisabled
    ? disabledLook
    : pressed ? vs.active : hovered ? vs.hover : vs.base;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        height: s.h,
        padding: `0 ${s.px}px`,
        width: fullWidth ? '100%' : undefined,
        fontFamily: 'var(--font-sans)',
        fontSize: s.fs,
        fontWeight: 600,
        letterSpacing: uppercase ? '0.3px' : '0.2px',
        textTransform: uppercase ? 'uppercase' : 'none',
        lineHeight: 1,
        borderRadius: shape === 'pill' ? 'var(--radius-pill)' : s.radius,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'transform var(--dur-fast) var(--ease-standard), color var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), background var(--dur-base) var(--ease-standard)',
        whiteSpace: 'nowrap',
        WebkitFontSmoothing: 'antialiased',
        transform: !isDisabled && pressed ? 'scale(0.98)' : 'none',
        ...stateLook,
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span style={{
          width: s.icon, height: s.icon, borderRadius: '50%',
          border: '2px solid currentColor', borderTopColor: 'transparent',
          display: 'inline-block', animation: 'rz-spin 0.7s linear infinite',
        }} />
      )}
      {!loading && leftIcon && (typeof leftIcon === 'string'
        ? <Glyph name={leftIcon} size={s.icon} />
        : leftIcon)}
      {children}
      {!loading && rightIcon && (typeof rightIcon === 'string'
        ? <Glyph name={rightIcon} size={s.icon} />
        : rightIcon)}
      <style>{`@keyframes rz-spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  );
}
export default Button;
