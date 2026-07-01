import React from 'react';
import { Glyph } from './Glyph.jsx';

/**
 * Text input with optional label, leading icon, helper/error text.
 * Matches the Rezervame field style: 12px radius, gray border, coral focus ring.
 */
export function Input({
  label,
  icon,
  trailing,
  placeholder,
  error,
  helper,
  disabled = false,
  size = 'md',
  style,
  containerStyle,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const h = size === 'lg' ? 54 : size === 'sm' ? 40 : 48;
  const borderColor = error
    ? 'var(--rz-error)'
    : focused
    ? 'var(--rz-coral)'
    : 'var(--border-default)';

  return (
    <label style={{ display: 'block', ...containerStyle }}>
      {label && (
        <span style={{
          display: 'block', marginBottom: 8,
          fontSize: 14, fontWeight: 500, color: 'var(--rz-gray-700)',
        }}>{label}</span>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        height: h, padding: '0 16px',
        background: disabled ? 'var(--rz-gray-100)' : 'var(--surface-card)',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: focused ? '0 0 0 4px var(--focus-ring)' : 'none',
        transition: 'border-color var(--dur-base), box-shadow var(--dur-base)',
        ...style,
      }}>
        {icon && <span style={{ color: 'var(--rz-gray-500)', display: 'flex' }}>
          {typeof icon === 'string' ? <Glyph name={icon} size={18} /> : icon}
        </span>}
        <input
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, minWidth: 0, height: '100%', border: 'none', outline: 'none',
            background: 'transparent', fontFamily: 'var(--font-sans)',
            fontSize: 15, color: 'var(--rz-gray-900)',
          }}
          {...rest}
        />
        {trailing && <span style={{ color: 'var(--rz-gray-500)', display: 'flex' }}>
          {typeof trailing === 'string' ? <Glyph name={trailing} size={18} /> : trailing}
        </span>}
      </div>
      {(error || helper) && (
        <span style={{
          display: 'block', marginTop: 6, fontSize: 13,
          color: error ? 'var(--rz-error)' : 'var(--rz-gray-500)',
        }}>{error || helper}</span>
      )}
    </label>
  );
}
export default Input;
