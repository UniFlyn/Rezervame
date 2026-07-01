import React from 'react';
import { SocialIconButton } from './SocialIconButton.jsx';

/**
 * SocialLinks — a row of <SocialIconButton>s.
 *
 * `items` is either a list of names (['instagram','facebook',…]) or a list of
 * { name, href, label } objects. variant/size/gap apply to the whole row.
 */
export function SocialLinks({
  items = ['instagram', 'facebook', 'linkedin', 'x'],
  variant = 'footer',
  size = 40,
  gap = 10,
  disabled = false,
  style,
  ...rest
}) {
  const list = items.map((it) => (typeof it === 'string' ? { name: it } : it));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap, flexWrap: 'wrap', ...style }} {...rest}>
      {list.map((it) => (
        <SocialIconButton
          key={it.name}
          name={it.name}
          href={it.href}
          label={it.label}
          variant={variant}
          size={size}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
export default SocialLinks;
