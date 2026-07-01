/* Account › Favoritos, Métodos de pago, Configuración. */
(() => {
  const DS = window.RezervameDesignSystem_4317c4;
  const { Button, Badge, Glyph, Input, Modal, Switch, BrandIcon, BusinessResultCard, EmptyState, Toast, Chip, NotificationItem, PersonCard, AddPersonModal } = DS;

  const SectionCard = ({ title, subtitle, action, children }) => (
    <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 'clamp(18px,3vw,24px)' }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: subtitle ? 4 : 16 }}>
          <div>
            {title && <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--rz-navy)' }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: 13.5, color: 'var(--rz-gray-500)', marginTop: 3 }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {subtitle && <div style={{ height: 14 }} />}
      {children}
    </div>
  );

  // ============================ FAVORITOS ============================
  function AccountFavorites({ onReserve }) {
    const [favs, setFavs] = React.useState(() => RZ.account.favorites.slice());
    const remove = (idx) => setFavs((f) => f.filter((i) => i !== idx));
    if (favs.length === 0) {
      return (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <EmptyState icon="heart" title="Aún no tienes negocios favoritos." message="Guarda los negocios que más te gustan para reservar más rápido la próxima vez." actionLabel="Explorar negocios" onAction={onReserve} />
        </div>
      );
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {favs.map((idx) => {
          const b = RZ.businesses[idx];
          return (
            <BusinessResultCard key={idx} image={b.img} name={b.name} rating={b.rating} reviews={b.reviews}
              category={b.category} location={b.location} distance={b.distance} services={b.services}
              priceFrom={b.priceFrom} priceTo={b.priceTo} favorite onFavorite={() => remove(idx)}
              onReserve={() => onReserve && onReserve()} onClick={() => onReserve && onReserve()} ctaLabel="Reservar" />
          );
        })}
      </div>
    );
  }

  // ============================ FAMILIA Y AMIGOS ============================
  function AccountPeople() {
    const [people, setPeople] = React.useState(() => (RZ.account.people || []).slice());
    const [modal, setModal] = React.useState({ open: false, person: null });
    const [toast, setToast] = React.useState(null);
    const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
    const save = (person) => {
      setPeople((list) => list.some((p) => p.id === person.id)
        ? list.map((p) => (p.id === person.id ? person : p))
        : [...list, person]);
      flash({ tone: 'success', title: modal.person ? 'Persona actualizada' : 'Persona agregada', message: `${person.name} fue ${modal.person ? 'actualizada' : 'agregada'} a tu lista.` });
    };
    const remove = (p) => { setPeople((list) => list.filter((x) => x.id !== p.id)); flash({ tone: 'success', title: 'Persona eliminada', message: `${p.name} fue eliminada de tu lista.` }); };

    return (
      <SectionCard title="Familia y amigos" subtitle="Administra a las personas para las que puedes reservar."
        action={people.length > 0 ? <Button variant="primary" size="sm" leftIcon="plus" onClick={() => setModal({ open: true, person: null })}>Agregar persona</Button> : undefined}>
        {people.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <EmptyState icon="user" title="Aún no has agregado familiares o amigos." message="Guarda a quién reservas para asignar citas más rápido la próxima vez." actionLabel="Agregar persona" onAction={() => setModal({ open: true, person: null })} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {people.map((p) => (
              <PersonCard key={p.id} name={p.name} relationship={p.relationship} phone={p.phone} email={p.email} note={p.notes}
                onEdit={() => setModal({ open: true, person: p })} onRemove={() => remove(p)} />
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 12, color: 'var(--rz-gray-400)' }}>
          <Glyph name="lock" size={13} /> Solo tú ves esta lista. No es necesario que la otra persona tenga una cuenta.
        </div>
        <AddPersonModal open={modal.open} person={modal.person} relationships={RZ.account.RELATIONSHIPS} onClose={() => setModal({ open: false, person: null })} onSave={save} />
        {toast && <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 200, maxWidth: 360 }}><Toast tone={toast.tone} title={toast.title} message={toast.message} onClose={() => setToast(null)} /></div>}
      </SectionCard>
    );
  }

  // ============================ MÉTODOS DE PAGO ============================
  const brandIconName = (brand) => brand === 'mastercard' ? 'PaymentMethodMastercardSize48' : brand === 'amex' ? 'PaymentMethodAmexSize48' : 'PaymentMethodVisaSize48';
  const brandLabel = (brand) => brand === 'mastercard' ? 'Mastercard' : brand === 'amex' ? 'Amex' : 'Visa';

  function AddCardModal({ open, onClose, onAdd }) {
    const [num, setNum] = React.useState('');
    const [exp, setExp] = React.useState('');
    const [name, setName] = React.useState('');
    const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    const fmtExp = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };
    const last4 = num.replace(/\D/g, '').slice(-4);
    const digits = num.replace(/\D/g, '');
    const detectBrand = () => { if (digits.startsWith('5')) return 'mastercard'; if (digits.startsWith('3')) return 'amex'; return 'visa'; };
    const activeBrand = digits.length >= 1 ? detectBrand() : null;
    const valid = last4.length === 4 && /^\d{2}\/\d{2}$/.test(exp) && name.trim();
    const submit = () => { if (!valid) return; onAdd({ id: 'c' + Date.now(), brand: detectBrand(), last4, exp, holder: name.trim(), default: false }); setNum(''); setExp(''); setName(''); onClose(); };
    const brands = ['visa', 'mastercard', 'amex'];
    return (
      <Modal open={open} onClose={onClose} width={460}>
        <div style={{ padding: 'clamp(26px,4vw,34px)', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: 21, fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: '-0.01em' }}>Agregar tarjeta</h2>
          <p style={{ fontSize: 13.5, color: 'var(--rz-gray-500)', marginTop: 5, marginBottom: 22 }}>Tus datos se procesan de forma segura.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Número de tarjeta"
              placeholder="1234 5678 9000 0000"
              inputMode="numeric"
              value={num}
              onChange={(e) => setNum(fmtCard(e.target.value))}
              trailing={activeBrand ? <BrandIcon name={brandIconName(activeBrand)} size={30} /> : undefined}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
              <Input label="Fecha exp." placeholder="MM/YY" inputMode="numeric" value={exp} onChange={(e) => setExp(fmtExp(e.target.value))} />
              <Input label="CVV" placeholder="123" inputMode="numeric" type="password" maxLength={4} />
            </div>
            <Input label="Nombre en la tarjeta" placeholder="Nombre Apellido" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', fontWeight: 500 }}>Aceptamos</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {brands.map((b) => (
                <span key={b} style={{ display: 'flex', opacity: !activeBrand || activeBrand === b ? 1 : 0.32, transition: 'opacity var(--dur-base)' }}>
                  <BrandIcon name={brandIconName(b)} size={34} />
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Button variant="outline" size="lg" fullWidth onClick={onClose}>Cancelar</Button>
            <Button variant="primary" size="lg" fullWidth leftIcon="plus" disabled={!valid} onClick={submit}>Guardar tarjeta</Button>
          </div>
        </div>
      </Modal>
    );
  }

  function AccountPayments() {
    const [cards, setCards] = React.useState(() => RZ.account.cards.slice());
    const [adding, setAdding] = React.useState(false);
    const [toast, setToast] = React.useState(null);
    const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };
    const setDefault = (id) => setCards((c) => c.map((x) => ({ ...x, default: x.id === id })));
    const remove = (id) => setCards((c) => { const next = c.filter((x) => x.id !== id); if (next.length && !next.some((x) => x.default)) next[0].default = true; return next; });
    const add = (card) => { setCards((c) => [...c, card]); flash({ tone: 'success', title: 'Tarjeta agregada', message: `${brandLabel(card.brand)} terminada en ${card.last4}.` }); };

    return (
      <SectionCard title="Métodos de pago" subtitle="Administra las tarjetas guardadas para tus reservas."
        action={<Button variant="primary" size="sm" leftIcon="plus" onClick={() => setAdding(true)}>Agregar tarjeta</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cards.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '14px 16px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: c.default ? 'var(--rz-coral-050)' : '#fff' }}>
              <BrandIcon name={brandIconName(c.brand)} size={44} />
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--rz-navy)' }}>{brandLabel(c.brand)} terminada en {c.last4}</span>
                  {c.default && <Badge tone="coral" size="sm">Predeterminada</Badge>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', marginTop: 2 }}>{c.holder} · Vence {c.exp}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!c.default && <Button variant="ghost" size="sm" onClick={() => setDefault(c.id)}>Predeterminar</Button>}
                <button aria-label="Eliminar tarjeta" onClick={() => remove(c.id)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 999, border: '1px solid var(--border-subtle)', background: '#fff', color: 'var(--rz-gray-500)', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rz-error, #d8453a)'; e.currentTarget.style.borderColor = 'var(--rz-error, #d8453a)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--rz-gray-500)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
                  <Glyph name="trash" size={16} />
                </button>
              </div>
            </div>
          ))}
          {cards.length === 0 && <p style={{ fontSize: 13.5, color: 'var(--rz-gray-500)', padding: '8px 0' }}>No tienes tarjetas guardadas.</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 12, color: 'var(--rz-gray-400)' }}>
          <Glyph name="lock" size={13} /> Nunca almacenamos el número completo de tu tarjeta.
        </div>
        <AddCardModal open={adding} onClose={() => setAdding(false)} onAdd={add} />
        {toast && <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 200, maxWidth: 360 }}><Toast tone={toast.tone} title={toast.title} message={toast.message} onClose={() => setToast(null)} /></div>}
      </SectionCard>
    );
  }

  // ============================ CONFIGURACIÓN ============================
  function PasswordModal({ open, onClose, onSaved }) {
    const [cur, setCur] = React.useState(''); const [nw, setNw] = React.useState(''); const [cf, setCf] = React.useState('');
    const valid = cur && nw.length >= 8 && nw === cf;
    return (
      <Modal open={open} onClose={onClose} width={420}>
        <div style={{ padding: 'clamp(24px,4vw,30px)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--rz-navy)' }}>Cambiar contraseña</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
            <Input label="Contraseña actual" type="password" value={cur} onChange={(e) => setCur(e.target.value)} />
            <Input label="Nueva contraseña" type="password" value={nw} onChange={(e) => setNw(e.target.value)} helper="Mínimo 8 caracteres." />
            <Input label="Confirmar nueva contraseña" type="password" value={cf} onChange={(e) => setCf(e.target.value)} error={cf && cf !== nw ? 'Las contraseñas no coinciden.' : undefined} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <Button variant="outline" size="lg" fullWidth onClick={onClose}>Cancelar</Button>
            <Button variant="primary" size="lg" fullWidth disabled={!valid} onClick={() => { onClose(); onSaved(); }}>Guardar</Button>
          </div>
        </div>
      </Modal>
    );
  }

  function AccountSettings({ onGoPayments, onLogout }) {
    const u = RZ.account.user;
    const [name, setName] = React.useState(u.name);
    const [email, setEmail] = React.useState(u.email);
    const [phone, setPhone] = React.useState(u.phone);
    const [remind, setRemind] = React.useState(true);
    const [promos, setPromos] = React.useState(false);
    const [pwOpen, setPwOpen] = React.useState(false);
    const [toast, setToast] = React.useState(null);
    const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

    const NotifRow = ({ title, desc, checked, onChange }) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-navy)' }}>{title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', marginTop: 2 }}>{desc}</div>
        </div>
        <Switch checked={checked} onChange={onChange} />
      </div>
    );

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 18, alignItems: 'start' }}>
        {/* Personal info */}
        <SectionCard title="Información personal" subtitle="Tu nombre y datos de contacto.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Correo electrónico" icon="mail" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Teléfono" icon="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div style={{ marginTop: 18 }}>
            <Button variant="primary" leftIcon="check" onClick={() => flash({ tone: 'success', title: 'Cambios guardados', message: 'Tu información fue actualizada.' })}>Guardar cambios</Button>
          </div>
        </SectionCard>

        {/* Notifications + security stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <SectionCard title="Preferencias de notificaciones" subtitle="Recibe avisos importantes por correo electrónico.">
            <NotifRow title="Recordatorios de citas" desc="Por correo electrónico" checked={remind} onChange={setRemind} />
            <NotifRow title="Promociones y novedades" desc="Por correo electrónico" checked={promos} onChange={setPromos} />
          </SectionCard>

          <SectionCard title="Seguridad">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--rz-gray-100)', color: 'var(--rz-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Glyph name="key" size={18} /></span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-navy)' }}>Contraseña</div>
                  <div style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', marginTop: 1 }}>Actualizada hace 3 meses</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}>Cambiar contraseña</Button>
            </div>
          </SectionCard>

          <SectionCard title="Métodos de pago">
            <button onClick={onGoPayments} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--rz-gray-100)', color: 'var(--rz-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Glyph name="creditCard" size={18} /></span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-navy)' }}>Administrar tarjetas</span>
              </span>
              <Glyph name="chevronRight" size={18} style={{ color: 'var(--rz-gray-400)' }} />
            </button>
          </SectionCard>

          <SectionCard>
            <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, color: 'var(--rz-error, #d8453a)' }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(216,69,58,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Glyph name="logOut" size={18} /></span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Cerrar sesión</span>
            </button>
          </SectionCard>
        </div>

        <PasswordModal open={pwOpen} onClose={() => setPwOpen(false)} onSaved={() => flash({ tone: 'success', title: 'Contraseña actualizada', message: 'Tu contraseña fue cambiada correctamente.' })} />
        {toast && <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 200, maxWidth: 360 }}><Toast tone={toast.tone} title={toast.title} message={toast.message} onClose={() => setToast(null)} /></div>}
      </div>
    );
  }

  // ============================ NOTIFICACIONES ============================
  const NOTIF_TONE = {
    calendar: { bg: 'var(--rz-coral-050)', fg: 'var(--rz-coral)' },
    checkCircle: { bg: 'var(--rz-success-bg)', fg: 'var(--rz-success)' },
    lock: { bg: 'var(--rz-info-bg, #e8f1fb)', fg: 'var(--rz-info, #2a6fdb)' },
    star: { bg: 'rgba(245,176,65,0.16)', fg: '#c98a12' },
    heart: { bg: 'var(--rz-coral-050)', fg: 'var(--rz-coral)' },
    arrowLeft: { bg: 'var(--rz-gray-100)', fg: 'var(--rz-gray-600)' },
    close: { bg: 'rgba(216,69,58,0.10)', fg: 'var(--rz-error, #d8453a)' },
    sparkles: { bg: 'var(--rz-coral-050)', fg: 'var(--rz-coral)' },
  };
  const CAT_LABEL = { reservas: 'Reserva', pagos: 'Pago', resenas: 'Reseña', favoritos: 'Favorito' };

  // ---- Review modal: leave a review for a specific completed reservation ----
  const RATING_WORDS = { 1: 'Mala', 2: 'Regular', 3: 'Buena', 4: 'Muy buena', 5: 'Excelente' };
  const REVIEW_TAGS = ['Excelente atención', 'Puntualidad', 'Lugar limpio', 'Buen resultado'];

  function ReviewModal({ open, reservation, onClose, onSubmit }) {
    const [rating, setRating] = React.useState(0);
    const [hover, setHover] = React.useState(0);
    const [comment, setComment] = React.useState('');
    const [tags, setTags] = React.useState([]);
    const [done, setDone] = React.useState(false);
    const resId = reservation && reservation.id;
    React.useEffect(() => {
      if (open) { setRating(0); setHover(0); setComment(''); setTags([]); setDone(false); }
    }, [open, resId]);
    if (!reservation) return null;

    const pros = [...new Set(reservation.services.map((s) => s.pro).filter(Boolean))];
    const serviceNames = reservation.services.map((s) => s.name).join(', ');
    const toggleTag = (t) => setTags((ts) => ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]);
    const shown = hover || rating;
    const submit = () => { if (rating < 1) return; onSubmit({ rating, comment: comment.trim(), tags }); setDone(true); };

    return (
      <Modal open={open} onClose={onClose} width={480}>
        {done ? (
          <div style={{ padding: 'clamp(32px,5vw,42px) clamp(26px,4vw,34px)', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'var(--rz-success-bg)', color: 'var(--rz-success)', marginBottom: 18 }}>
              <Glyph name="checkCircle" size={32} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: '-0.2px' }}>Gracias por compartir tu experiencia.</h2>
            <p style={{ fontSize: 14.5, color: 'var(--rz-gray-500)', marginTop: 10, lineHeight: 1.55, maxWidth: 340, margin: '10px auto 0' }}>
              Tu reseña de {reservation.business} ya fue publicada y ayudará a otros clientes a elegir mejor.
            </p>
            <div style={{ marginTop: 26 }}>
              <Button variant="primary" size="lg" fullWidth onClick={onClose}>Listo</Button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 'clamp(26px,4vw,32px)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: 21, fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: '-0.01em' }}>Deja tu reseña</h2>
            <p style={{ fontSize: 13.5, color: 'var(--rz-gray-500)', marginTop: 5 }}>Tu opinión ayuda a otros clientes a elegir mejor.</p>

            {/* reservation summary */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginTop: 20, padding: 16, background: 'var(--rz-gray-050)', borderRadius: 'var(--radius-md)' }}>
              <img src={reservation.img} alt="" style={{ width: 52, height: 52, flex: 'none', borderRadius: 10, objectFit: 'cover' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--rz-navy)' }}>{reservation.business}</div>
                <div style={{ fontSize: 13, color: 'var(--rz-gray-600)', marginTop: 3, lineHeight: 1.45 }}>{serviceNames}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6, fontSize: 12.5, color: 'var(--rz-gray-500)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Glyph name="calendar" size={13} /> {reservation.dateLabel}</span>
                  {pros.length > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Glyph name="user" size={13} /> {pros.join(', ')}</span>}
                </div>
              </div>
            </div>

            {/* star rating (required) */}
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-gray-700)', marginBottom: 10 }}>Tu calificación</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 4 }} onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" aria-label={`${s} estrella${s > 1 ? 's' : ''}`}
                      onMouseEnter={() => setHover(s)} onClick={() => setRating(s)}
                      style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', lineHeight: 0, color: s <= shown ? '#f5b041' : 'var(--rz-gray-300, #cdd3da)', transition: 'color var(--dur-fast) var(--ease-standard), transform var(--dur-fast)' }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = 'none'; }}>
                      <Glyph name="star" size={34} filled={s <= shown} />
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: shown ? 'var(--rz-navy)' : 'var(--rz-gray-400)', minWidth: 78 }}>
                  {shown ? RATING_WORDS[shown] : 'Sin calificar'}
                </span>
              </div>
            </div>

            {/* optional tags */}
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-gray-700)', marginBottom: 10 }}>¿Qué destacarías? <span style={{ fontWeight: 500, color: 'var(--rz-gray-400)' }}>(opcional)</span></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {REVIEW_TAGS.map((t) => {
                  const on = tags.includes(t);
                  return (
                    <button key={t} type="button" onClick={() => toggleTag(t)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, transition: 'all var(--dur-base)',
                        background: on ? 'var(--rz-coral-050)' : 'var(--surface-card)', color: on ? 'var(--rz-coral)' : 'var(--rz-gray-700)', border: `1.5px solid ${on ? 'var(--rz-coral)' : 'var(--border-default)'}` }}>
                      {on && <Glyph name="check" size={14} />} {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* comment */}
            <div style={{ marginTop: 22 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--rz-gray-700)', marginBottom: 10 }}>
                Tu comentario <span style={{ fontWeight: 500, color: 'var(--rz-gray-400)' }}>(opcional)</span>
              </label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={500}
                placeholder="Cuéntale a otros clientes cómo fue tu experiencia…"
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 84, padding: '12px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--rz-gray-900)', background: 'var(--surface-card)', border: '1.5px solid var(--border-default)', borderRadius: 'var(--radius-md)', outline: 'none', lineHeight: 1.5 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--rz-coral)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--focus-ring)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Button variant="outline" size="lg" fullWidth onClick={onClose}>Cancelar</Button>
              <Button variant="primary" size="lg" fullWidth leftIcon="star" disabled={rating < 1} onClick={submit}>Publicar reseña</Button>
            </div>
          </div>
        )}
      </Modal>
    );
  }

  function NotificationCenter({ items, onItemClick, onMarkRead, onMarkAllRead, onExplore, onReview, reviewedIds }) {
    const [filter, setFilter] = React.useState('todas');
    const list = items || [];
    const unread = list.filter((n) => n.unread);
    const isReviewed = (n) => n.action === 'review' && n.reservationId && (reviewedIds || []).includes(n.reservationId);
    const matches = (n) => {
      if (filter === 'todas') return true;
      if (filter === 'noleidas') return n.unread;
      if (filter === 'leidas') return !n.unread;
      return n.category === filter;
    };
    const filtered = list.filter(matches);
    const countFor = (f) => f === 'noleidas' ? unread.length : f === 'leidas' ? list.length - unread.length : null;

    const FILTERS = [
      { value: 'todas', label: 'Todas' },
      { value: 'noleidas', label: 'No leídas' },
      { value: 'leidas', label: 'Leídas' },
      { value: 'reservas', label: 'Reservas' },
      { value: 'pagos', label: 'Pagos' },
      { value: 'resenas', label: 'Reseñas' },
      { value: 'favoritos', label: 'Favoritos' },
    ];

    const handleClick = (n) => {
      if (n.action === 'review' && onReview && !isReviewed(n)) { onReview(n); return; }
      if (onItemClick) onItemClick(n); else if (onMarkRead) onMarkRead(n.id);
    };

    return (
      <div>
        {/* heading + mark all */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 22 }}>Notificaciones</h2>
            <p style={{ fontSize: 14, color: 'var(--rz-gray-500)', marginTop: 4 }}>
              {unread.length > 0
                ? `Tienes ${unread.length} ${unread.length === 1 ? 'notificación sin leer' : 'notificaciones sin leer'}.`
                : 'Estás al día. No tienes notificaciones sin leer.'}
            </p>
          </div>
          <Button variant="outline" size="sm" leftIcon="check" disabled={unread.length === 0} onClick={() => onMarkAllRead && onMarkAllRead()}>
            Marcar todas como leídas
          </Button>
        </div>

        {/* filter chips */}
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 18 }}>
          {FILTERS.map((f) => (
            <Chip key={f.value} active={filter === f.value} uppercase={false} count={countFor(f.value)} onClick={() => setFilter(f.value)}>
              {f.label}
            </Chip>
          ))}
        </div>

        {/* list */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}>
            <EmptyState
              icon="bell"
              title={list.length === 0 ? 'No tienes notificaciones por ahora.' : 'Nada por aquí.'}
              message={list.length === 0
                ? 'Aquí verás recordatorios de citas, actualizaciones de reservas y avisos importantes.'
                : 'No hay notificaciones que coincidan con este filtro.'}
              actionLabel={list.length === 0 ? 'Explorar negocios' : undefined}
              onAction={list.length === 0 ? onExplore : undefined}
            />
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            {filtered.map((n, i) => (
              <NotificationItem
                key={n.id} variant="full" divider={i > 0}
                icon={n.icon} title={n.title} message={n.message}
                time={n.date || n.time} categoryLabel={CAT_LABEL[n.category]}
                actionLabel={n.actionLabel} reviewed={isReviewed(n)} unread={n.unread}
                onClick={() => handleClick(n)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  window.AccountFavorites = AccountFavorites;
  window.AccountPeople = AccountPeople;
  window.AccountPayments = AccountPayments;
  window.AccountSettings = AccountSettings;
  window.AccountNotifications = NotificationCenter;
  window.AccountReviewModal = ReviewModal;
})();
