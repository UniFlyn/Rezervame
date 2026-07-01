import React from 'react';
import { Button } from '../core/Button.jsx';
import { Input } from '../core/Input.jsx';
import { IconButton } from '../core/IconButton.jsx';
import { BrandIcon } from '../../assets/brand-icons/BrandIcon.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Login / Sign-up modal — the base auth surface (not a full flow). Email-first
 * with a Google option. Centered over a dark scrim, brand mark on top, rounded
 * corners, soft shadow. Composes the DS Button / Input / IconButton / BrandIcon.
 *
 * States: default · loading (spinner CTA) · error (invalid email) · disabled
 * (empty email). Responsive: full-width padding collapses on small screens.
 */
export function LoginModal({
  open = true,
  logoSrc,
  title = 'Inicia sesión o crea tu cuenta',
  helper = 'Reserva, gestiona tus citas y guarda tus negocios favoritos.',
  loading = false,
  error: errorProp,
  onSubmit,
  onGoogle,
  onClose,
  onHelp,
  style,
}) {
  const [email, setEmail] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState(errorProp || '');
  React.useEffect(() => { setError(errorProp || ''); if (errorProp) setTouched(true); }, [errorProp]);

  if (!open) return null;
  const empty = email.trim() === '';

  const submit = () => {
    if (empty) return;
    if (!EMAIL_RE.test(email.trim())) { setTouched(true); setError('Ingresa un correo electrónico válido.'); return; }
    setError('');
    onSubmit && onSubmit(email.trim());
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 130,
        background: 'var(--overlay-scrim)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, overflowY: 'auto', animation: 'rz-fade 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={title}
        style={{
          position: 'relative', width: '100%', maxWidth: 440,
          background: 'var(--surface-card)', borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-modal)',
          padding: 'clamp(26px, 5vw, 40px) clamp(22px, 5vw, 38px) clamp(22px, 4vw, 30px)',
          animation: 'rz-pop 0.24s var(--ease-out)', ...style,
        }}
      >
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <IconButton icon="close" variant="ghost" round size="md" onClick={onClose} label="Cerrar" />
        </div>

        {/* Brand mark */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          {logoSrc
            ? <img src={logoSrc} alt="Rezervame" style={{ height: 30 }} />
            : <span style={{ fontWeight: 700, fontSize: 28, color: 'var(--rz-coral)', letterSpacing: '-0.02em' }}>rezervame</span>}
        </div>

        <h2 style={{ fontSize: 24, textAlign: 'center', lineHeight: 1.22 }}>{title}</h2>
        {helper && <p style={{ fontSize: 14, color: 'var(--rz-gray-500)', textAlign: 'center', marginTop: 10, lineHeight: 1.5, maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>{helper}</p>}

        <div style={{ marginTop: 24 }}>
          <Input
            type="email"
            inputMode="email"
            label="Correo electrónico"
            placeholder="tucorreo@ejemplo.com"
            icon="mail"
            value={email}
            disabled={loading}
            error={touched ? error : ''}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            onBlur={() => setTouched(true)}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <Button variant="primary" size="lg" fullWidth loading={loading} disabled={empty} onClick={submit}>Continuar</Button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: 13, color: 'var(--rz-gray-400)' }}>o</span>
          <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        <button
          onClick={onGoogle}
          disabled={loading}
          style={{
            width: '100%', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'var(--surface-card)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-btn-lg)', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--rz-navy)',
            transition: 'background var(--dur-base), border-color var(--dur-base)',
          }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = 'var(--rz-gray-050)'; e.currentTarget.style.borderColor = 'var(--rz-gray-400)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-card)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
        >
          <BrandIcon name="GoogleTypeGoogleStyleColouredLabel" size={20} />
          Continuar con Google
        </button>

        {/* Legal */}
        <p style={{ fontSize: 12, color: 'var(--rz-gray-400)', textAlign: 'center', marginTop: 22, lineHeight: 1.55 }}>
          Al continuar, aceptas los <a style={legalLink} href="#">Términos del servicio</a> y la <a style={legalLink} href="#">Política de privacidad</a> de Rezervame.
        </p>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button onClick={onHelp} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--rz-coral)' }}>¿Necesitas ayuda?</button>
        </div>

        <style>{`@keyframes rz-fade{from{opacity:0}to{opacity:1}}@keyframes rz-pop{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:none}}`}</style>
      </div>
    </div>
  );
}
const legalLink = { color: 'var(--rz-gray-600)', fontWeight: 600, textDecoration: 'underline' };

export default LoginModal;
