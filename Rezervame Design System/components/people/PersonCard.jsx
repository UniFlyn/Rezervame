import React from 'react';
import { Glyph } from '../core/Glyph.jsx';
import { Avatar } from '../core/Avatar.jsx';
import { Badge } from '../core/Badge.jsx';
import { IconButton } from '../core/IconButton.jsx';

/**
 * PersonCard — one saved person (family member / friend) you can book for.
 * Two variants:
 *   - variant="manage" (default): list row with Edit + Remove actions.
 *   - variant="select": a selectable option (recipient picker); shows a coral
 *     ring + check when `selected`.
 * Pass `icon` to render a glyph avatar instead of initials (e.g. "Para mí").
 */
export function PersonCard({
  name, relationship, phone, email, note, icon,
  variant = 'manage', selected = false, subtitle,
  onSelect, onEdit, onRemove, style,
}) {
  const isSelect = variant === 'select';
  const [hover, setHover] = React.useState(false);

  const avatar = icon
    ? <span style={{ flex: 'none', width: 44, height: 44, borderRadius: '50%', background: 'var(--rz-coral-050)', color: 'var(--rz-coral)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: isSelect && selected ? '2px solid var(--rz-coral)' : '1px solid var(--border-subtle)' }}><Glyph name={icon} size={21} /></span>
    : <Avatar name={name} size={44} ring={isSelect && selected} />;

  const metaLine = subtitle != null ? subtitle : [relationship, phone].filter(Boolean).join(' · ');

  if (isSelect) {
    return (
      <button
        type="button" onClick={onSelect}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
          padding: '12px 14px', cursor: 'pointer', borderRadius: 'var(--radius-md)',
          background: selected ? 'var(--rz-coral-050)' : '#fff',
          border: `1.5px solid ${selected ? 'var(--rz-coral)' : 'var(--border-subtle)'}`,
          transition: 'border-color var(--dur-base), background var(--dur-base)', ...style,
        }}
        onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--border-default)'; }}
        onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
      >
        {avatar}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--rz-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          {metaLine && <span style={{ display: 'block', fontSize: 12.5, color: 'var(--rz-gray-500)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{metaLine}</span>}
        </span>
        {selected
          ? <Glyph name="checkCircle" size={20} style={{ color: 'var(--rz-coral)', flex: 'none' }} />
          : <span style={{ flex: 'none', width: 20, height: 20, borderRadius: '50%', border: '1.5px solid var(--border-default)' }} />}
      </button>
    );
  }

  // ---- manage ----
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      padding: '14px 16px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: '#fff', ...style,
    }}>
      {avatar}
      <div style={{ flex: 1, minWidth: 140 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--rz-navy)' }}>{name}</span>
          {relationship && <Badge tone="neutral" size="sm" uppercase={false}>{relationship}</Badge>}
        </div>
        {(phone || email) && (
          <div style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {phone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Glyph name="phone" size={13} style={{ color: 'var(--rz-gray-400)' }} />{phone}</span>}
            {email && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Glyph name="mail" size={13} style={{ color: 'var(--rz-gray-400)' }} />{email}</span>}
          </div>
        )}
        {note && <div style={{ fontSize: 12, color: 'var(--rz-gray-400)', marginTop: 4, lineHeight: 1.45 }}>{note}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
        {onEdit && <IconButton icon="edit" variant="ghost" size="sm" round label="Editar" onClick={onEdit} />}
        {onRemove && (
          <button
            type="button" aria-label="Eliminar" onClick={onRemove}
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 999,
              border: `1px solid ${hover ? 'var(--rz-error, #d8453a)' : 'var(--border-subtle)'}`, background: '#fff',
              color: hover ? 'var(--rz-error, #d8453a)' : 'var(--rz-gray-500)', cursor: 'pointer',
              transition: 'color var(--dur-base), border-color var(--dur-base)',
            }}
          ><Glyph name="trash" size={15} /></button>
        )}
      </div>
    </div>
  );
}
export default PersonCard;
