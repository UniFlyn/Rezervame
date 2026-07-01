import React from 'react';
import { SocialIcon, SOCIAL_LABELS } from './SocialIcon.jsx';

/**
 * SocialIconButton — circular brand button wrapping a <SocialIcon>.
 *
 * variant:
 *   footer  — white icon in a subtle outlined circle (use on coral footer)
 *   neutral — navy icon, light neutral outline (use on white/light backgrounds)
 *   coral   — coral fill, white icon
 *   dark    — navy fill, white icon
 * size:   32 | 40 (default) | 48 — icon scales proportionally, optically centered.
 * states: default · hover · pressed · disabled (all built in).
 *
 * Renders an <a> when `href` is set, otherwise a <button>.
 */
const SIZES = {
  32: { box: 32, icon: 16 },
  40: { box: 40, icon: 20 },
  48: { box: 48, icon: 24 },
};

const CORAL = 'var(--rz-coral)';
const NAVY = 'var(--rz-navy)';

const VARIANTS = {
  footer: {
    base:  { background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.55)' },
    hover: { background: '#fff', color: CORAL, border: '1.5px solid #fff' },
  },
  neutral: {
    base:  { background: 'var(--surface-card)', color: NAVY, border: '1.5px solid var(--border-default)' },
    hover: { background: 'var(--rz-navy-050)', color: NAVY, border: `1.5px solid ${NAVY}` },
  },
  coral: {
    base:  { background: CORAL, color: '#fff', border: '1.5px solid transparent' },
    hover: { background: 'var(--rz-coral-600)', color: '#fff', border: '1.5px solid transparent' },
  },
  dark: {
    base:  { background: NAVY, color: '#fff', border: '1.5px solid transparent' },
    hover: { background: 'var(--rz-navy-800)', color: '#fff', border: '1.5px solid transparent' },
  },
};

export function SocialIconButton({
  name,
  href,
  variant = 'footer',
  size = 40,
  disabled = false,
  label,
  onClick,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES[40];
  const v = VARIANTS[variant] || VARIANTS.footer;
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const disabledLook = { background: 'var(--rz-gray-100)', color: 'var(--rz-gray-400)', border: '1.5px solid var(--border-subtle)' };
  const look = disabled ? disabledLook : (hovered ? v.hover : v.base);

  const Tag = href && !disabled ? 'a' : 'button';
  const aria = label || SOCIAL_LABELS[name] || name;

  return (
    <Tag
      href={href && !disabled ? href : undefined}
      target={href && !disabled ? '_blank' : undefined}
      rel={href && !disabled ? 'noopener noreferrer' : undefined}
      aria-label={aria}
      title={aria}
      aria-disabled={disabled || undefined}
      disabled={Tag === 'button' ? disabled : undefined}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        flex: 'none',
        width: s.box, height: s.box,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, boxSizing: 'border-box',
        borderRadius: 'var(--radius-pill)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textDecoration: 'none',
        transform: !disabled && pressed ? 'scale(0.9)' : 'none',
        transition: 'background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)',
        ...look,
        ...style,
      }}
      {...rest}
    >
      <SocialIcon name={name} size={s.icon} />
    </Tag>
  );
}
export default SocialIconButton;
