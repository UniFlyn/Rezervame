import React from 'react';
import { Modal } from '../feedback/Modal.jsx';
import { Glyph } from '../core/Glyph.jsx';
import { PersonCard } from './PersonCard.jsx';
import { AddPersonModal, RELATIONSHIPS } from './AddPersonModal.jsx';

/**
 * RecipientPicker — choose who a booking (or a single service) is for.
 * Lists "Para mí" + every saved person as selectable PersonCards, plus an
 * "Agregar nueva persona" action that opens an inline AddPersonModal without
 * leaving the flow. Selecting a row calls onChange(value) and closes.
 *
 * value: 'self' | <personId>
 */
export function RecipientPicker({
  open, onClose, people = [], value = 'self', onChange, onAddPerson,
  allowSelf = true, selfName = 'Para mí', selfSubtitle = 'Tu cuenta',
  title = '¿Para quién es esta reserva?', subtitle = 'Reserva para ti, un familiar o un amigo.',
  relationships = RELATIONSHIPS,
}) {
  const [adding, setAdding] = React.useState(false);
  const select = (v) => { onChange && onChange(v); onClose && onClose(); };
  const handleAdd = (person) => { onAddPerson && onAddPerson(person); select(person.id); };

  return (
    <>
      <Modal open={open} onClose={onClose} width={460}>
        <div style={{ padding: 'clamp(22px,4vw,28px)', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: '-0.01em' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 13.5, color: 'var(--rz-gray-500)', marginTop: 5 }}>{subtitle}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            {allowSelf && (
              <PersonCard variant="select" icon="user" name={selfName} subtitle={selfSubtitle} selected={value === 'self'} onSelect={() => select('self')} />
            )}
            {people.map((p) => (
              <PersonCard
                key={p.id} variant="select" name={p.name}
                subtitle={[p.relationship, p.phone].filter(Boolean).join(' · ')}
                selected={value === p.id} onSelect={() => select(p.id)}
              />
            ))}
          </div>

          <button
            type="button" onClick={() => setAdding(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginTop: 12, padding: '13px 14px',
              background: 'transparent', border: '1.5px dashed var(--border-default)', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--rz-coral)',
              transition: 'border-color var(--dur-base), background var(--dur-base)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--rz-coral)'; e.currentTarget.style.background = 'var(--rz-coral-050)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ flex: 'none', width: 28, height: 28, borderRadius: '50%', background: 'var(--rz-coral-050)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Glyph name="plus" size={16} /></span>
            Agregar nueva persona
          </button>
        </div>
      </Modal>

      <AddPersonModal open={adding} onClose={() => setAdding(false)} onSave={handleAdd} relationships={relationships} />
    </>
  );
}
export default RecipientPicker;
