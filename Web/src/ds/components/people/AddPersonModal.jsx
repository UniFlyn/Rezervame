import React from 'react';
import { Modal } from '../feedback/Modal.jsx';
import { Input } from '../core/Input.jsx';
import { Select } from '../core/Select.jsx';
import { Button } from '../core/Button.jsx';

export const RELATIONSHIPS = ['Mamá', 'Papá', 'Esposo/a', 'Hijo/a', 'Hermano/a', 'Amigo/a', 'Otro'];

/**
 * AddPersonModal — add or edit a family member / friend you book for.
 * Pass `person` to edit (prefills + switches the title/CTA to "Editar").
 * Calls onSave with { id, name, relationship, phone, email, notes }.
 */
export function AddPersonModal({ open, onClose, onSave, person = null, relationships = RELATIONSHIPS, title }) {
  const [name, setName] = React.useState('');
  const [relationship, setRelationship] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setName(person?.name || '');
    setRelationship(person?.relationship || '');
    setPhone(person?.phone || '');
    setEmail(person?.email || '');
    setNotes(person?.notes || '');
  }, [open, person]);

  const editing = !!person;
  const valid = name.trim() && relationship && phone.trim();
  const submit = () => {
    if (!valid) return;
    onSave({
      id: person?.id || 'p' + Date.now(),
      name: name.trim(), relationship, phone: phone.trim(),
      email: email.trim(), notes: notes.trim(),
    });
    onClose && onClose();
  };

  return (
    <Modal open={open} onClose={onClose} width={460}>
      <div style={{ padding: 'clamp(26px,4vw,34px)', boxSizing: 'border-box' }}>
        <h2 style={{ fontSize: 21, fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: '-0.01em' }}>{title || (editing ? 'Editar persona' : 'Agregar persona')}</h2>
        <p style={{ fontSize: 13.5, color: 'var(--rz-gray-500)', marginTop: 5, marginBottom: 22 }}>Guarda a quién reservas para encontrarlo rápido la próxima vez.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nombre completo" placeholder="Nombre y apellido" value={name} onChange={(e) => setName(e.target.value)} />
          <Select label="Relación" placeholder="Selecciona" value={relationship} options={relationships} onChange={setRelationship} />
          <Input label="Teléfono" icon="phone" placeholder="+507 6000-0000" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Correo electrónico (opcional)" icon="mail" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: 'var(--rz-gray-700)' }}>Notas (opcional)</span>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={240}
              placeholder="Preferencias, alergias o cualquier detalle útil…"
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 64, padding: '12px 14px', fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--rz-gray-900)', background: 'var(--surface-card)', border: '1.5px solid var(--border-default)', borderRadius: 'var(--radius-md)', outline: 'none', lineHeight: 1.5 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--rz-coral)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--focus-ring)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <Button variant="outline" size="lg" fullWidth onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="lg" fullWidth leftIcon={editing ? 'check' : 'plus'} disabled={!valid} onClick={submit}>{editing ? 'Guardar' : 'Agregar persona'}</Button>
        </div>
      </div>
    </Modal>
  );
}
export default AddPersonModal;
