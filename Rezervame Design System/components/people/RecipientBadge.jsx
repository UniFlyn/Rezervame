import React from 'react';
import { Glyph } from '../core/Glyph.jsx';

/**
 * RecipientBadge — read-only "Para: X" indicator showing who a service /
 * reservation is for. Used in the booking summary, reservation cards and the
 * reservation-details view. When `self` (or no name) it reads "Para: Ti".
 */
export function RecipientBadge({ name, self = false, selfLabel = 'Ti', prefix = 'Para', icon = 'user', size = 'sm', style }) {
  const isSelf = self || !name;
  const fs = size === 'md' ? 13.5 : 12.5;
  const ic = size === 'md' ? 15 : 13;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: fs, color: 'var(--rz-gray-600)', minWidth: 0, ...style }}>
      <Glyph name={icon} size={ic} style={{ color: 'var(--rz-coral)', flex: 'none' }} />
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {prefix}: <strong style={{ color: 'var(--rz-navy)', fontWeight: 700 }}>{isSelf ? selfLabel : name}</strong>
      </span>
    </span>
  );
}
export default RecipientBadge;
