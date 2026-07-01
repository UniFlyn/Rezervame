/* Account › Mis reservas — filters, search, rich reservation cards, calendar /
   share menus and the reservation-details modal. Shared menu widgets are
   exported to window so other account tabs can reuse them. */
(() => {
  const DS = window.RezervameDesignSystem_4317c4;
  // Menu + MenuItem are now Design-System components (components/navigation/Menu).
  const { Button, Badge, Glyph, Chip, Input, Modal, Toast, Menu, MenuItem, RecipientBadge, PersonBookingGroup } = DS;
  const money = (n) => `$${Number(n).toFixed(2)}`;
  // Who a reservation is for, from per-service `for` (null = account owner).
  const recipientInfo = (res) => {
    const fors = (res.services || []).map((s) => s.for || null);
    const others = [...new Set(fors.filter(Boolean))];
    const hasSelf = fors.some((f) => !f);
    if (others.length === 0) return { kind: 'self' };
    if (others.length === 1 && !hasSelf) return { kind: 'one', name: others[0] };
    return { kind: 'multi', count: others.length + (hasSelf ? 1 : 0) };
  };

  // ---- a small ghost action pill used on cards ----
  const ActionPill = React.forwardRef(({ icon, children, onClick, tone }, ref) => (
    <button ref={ref} type="button" onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff',
      border: '1px solid var(--border-subtle)', borderRadius: 999, cursor: 'pointer',
      fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
      color: tone === 'danger' ? 'var(--rz-error, #d8453a)' : 'var(--rz-navy)', padding: '8px 14px',
      transition: 'background var(--dur-base), border-color var(--dur-base)',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rz-gray-050)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
      <Glyph name={icon} size={15} style={{ flex: 'none' }} /> {children}
    </button>
  ));

  // ---- Calendar menu (Google / Apple / Outlook) ----
  function CalendarButton({ res }) {
    const A = RZ.account;
    return (
      <Menu width={216} trigger={({ toggle }) => <ActionPill icon="calendar" onClick={toggle}>Calendario</ActionPill>}>
        {({ close }) => (<>
          <MenuItem icon="calendar" onClick={() => { window.open(A.calendar(res).google, '_blank', 'noopener'); close(); }}>Google Calendar</MenuItem>
          <MenuItem icon="download" onClick={() => { A.downloadICS(res); close(); }}>Apple Calendar / iCal</MenuItem>
          <MenuItem icon="calendar" onClick={() => { window.open(A.calendar(res).outlook, '_blank', 'noopener'); close(); }}>Outlook</MenuItem>
        </>)}
      </Menu>
    );
  }
  // ---- Share menu (Copiar enlace only) ----
  function ShareButton({ res }) {
    const [copied, setCopied] = React.useState(false);
    const copy = async (close) => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(res.reservationUrl);
        else { const t = document.createElement('textarea'); t.value = res.reservationUrl; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
        setCopied(true); setTimeout(() => { setCopied(false); close(); }, 1300);
      } catch (e) { /* ignore */ }
    };
    return (
      <Menu width={186} trigger={({ toggle }) => <ActionPill icon="share" onClick={() => { setCopied(false); toggle(); }}>Compartir</ActionPill>}>
        {({ close }) => (
          <MenuItem icon={copied ? 'check' : 'link'} iconColor={copied ? 'var(--rz-success)' : 'var(--rz-coral)'} onClick={() => copy(close)}>
            {copied ? 'Enlace copiado' : 'Copiar enlace'}
          </MenuItem>
        )}
      </Menu>
    );
  }

  // ---- payment-status chip ----
  function PayStatusChip({ status, size = 'sm' }) {
    const meta = RZ.account.PAYSTATUS[status] || { tone: 'neutral', icon: 'shield' };
    const toneColor = { success: 'var(--rz-success)', info: 'var(--rz-info, #2a6fdb)', warning: 'var(--rz-warning)', error: 'var(--rz-error, #d8453a)', neutral: 'var(--rz-gray-500)' }[meta.tone];
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: size === 'sm' ? 12 : 13, fontWeight: 600, color: toneColor }}>
        <Glyph name={meta.icon} size={size === 'sm' ? 13 : 15} /> {status}
      </span>
    );
  }

  // ---- reservation card ----
  function ReservationCard({ res, onDetails, onReschedule, onCancel, onRebook }) {
    const A = RZ.account;
    const st = A.STATUS[res.status];
    const canMod = A.canModify(res);
    const upcomingState = A.isUpcomingState(res);
    const serviceLine = res.services.map((s) => s.name).join(' · ');
    return (
      <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 16, padding: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 92, height: 92, flex: 'none', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--rz-gray-100)' }}>
            <img src={res.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ fontSize: 17, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1.25 }}>{res.business}</h4>
                <p style={{ fontSize: 13.5, color: 'var(--rz-gray-600)', marginTop: 3, lineHeight: 1.4 }}>{serviceLine}</p>
              </div>
              <Badge tone={st.tone} dot>{st.label}</Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--rz-gray-500)' }}><Glyph name="calendar" size={14} /> {res.dateLabel} · {res.timeRange}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--rz-navy)' }}>{money(res.total)}</span>
            </div>
            <div style={{ marginTop: 8 }}><PayStatusChip status={res.paymentStatus} /></div>
            {(() => {
              const r = recipientInfo(res);
              const node = r.kind === 'one'
                ? <RecipientBadge prefix="Reserva para" name={r.name} />
                : r.kind === 'multi'
                  ? <RecipientBadge prefix="Reserva para" name={`${r.count} personas`} />
                  : <RecipientBadge prefix="Reserva para" self />;
              return <div style={{ marginTop: 7 }}>{node}</div>;
            })()}
          </div>
        </div>

        {/* not-confirmed notice for reservations whose payment was not completed */}
        {res.status === 'pending' && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 16px', background: 'var(--rz-warning-bg)', borderTop: '1px solid var(--border-subtle)', fontSize: 12.5, color: 'var(--rz-warning)', lineHeight: 1.45 }}>
            <Glyph name="clock" size={14} style={{ flex: 'none', marginTop: 1 }} /> Tu reserva aún no está confirmada. Completa el pago para asegurar tu cita.
          </div>
        )}

        {/* lock notice for soon-to-start reservations */}
        {upcomingState && res.status !== 'pending' && !canMod && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--rz-gray-050)', borderTop: '1px solid var(--border-subtle)', fontSize: 12.5, color: 'var(--rz-gray-500)' }}>
            <Glyph name="clock" size={14} style={{ flex: 'none' }} /> Ya no es posible cancelar o reagendar esta cita.
          </div>
        )}

        {/* actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
          <Button variant="primary" size="sm" onClick={() => onDetails(res)}>Ver detalles</Button>
          {res.status === 'pending' && <Button variant="dark" size="sm" leftIcon="lock" onClick={() => onDetails(res)}>Completar pago</Button>}
          {(res.status === 'completed' || res.status === 'cancelled' || res.status === 'noshow') && (
            <Button variant="outline" size="sm" onClick={() => onRebook(res)}>Reservar de nuevo</Button>
          )}
          {upcomingState && <CalendarButton res={res} />}
          {upcomingState && <ShareButton res={res} />}
          {canMod && <ActionPill icon="edit" onClick={() => onReschedule(res)}>Reagendar</ActionPill>}
          {canMod && <ActionPill icon="close" tone="danger" onClick={() => onCancel(res)}>Cancelar</ActionPill>}
        </div>
      </div>
    );
  }

  // ---- reservation details modal ----
  function ReservationDetails({ res, onClose, onReschedule, onCancel, onRebook }) {
    if (!res) return null;
    const A = RZ.account;
    const st = A.STATUS[res.status];
    const canMod = A.canModify(res);
    const row = (label, value, strong) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '7px 0', fontSize: 14 }}>
        <span style={{ color: 'var(--rz-gray-500)' }}>{label}</span>
        <span style={{ fontWeight: strong ? 700 : 600, color: 'var(--rz-navy)', textAlign: 'right' }}>{value}</span>
      </div>
    );
    return (
      <Modal open={!!res} onClose={onClose} width={540}>
        <div style={{ padding: 'clamp(24px,4vw,30px)' }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, flex: 'none', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--rz-gray-100)' }}>
              <img src={res.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--rz-navy)' }}>{res.business}</h2>
                <Badge tone={st.tone} dot>{st.label}</Badge>
              </div>
              <p style={{ fontSize: 13, color: 'var(--rz-gray-500)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}><Glyph name="mapPin" size={14} /> {res.address}</p>
            </div>
          </div>

          {/* confirmation status banner */}
          {res.status === 'pending' ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, padding: '12px 14px', background: 'var(--rz-warning-bg)', borderRadius: 'var(--radius-md)' }}>
              <Glyph name="clock" size={17} style={{ color: 'var(--rz-warning)', flex: 'none', marginTop: 1 }} />
              <div style={{ fontSize: 13, color: 'var(--rz-warning)', lineHeight: 1.5 }}>
                <strong>Esta reserva aún no está confirmada.</strong> Completa el pago para asegurar tu cita.
              </div>
            </div>
          ) : A.isConfirmed(res) ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, padding: '12px 14px', background: 'var(--rz-success-bg)', borderRadius: 'var(--radius-md)' }}>
              <Glyph name="shield" size={17} style={{ color: 'var(--rz-success)', flex: 'none', marginTop: 1 }} />
              <div style={{ fontSize: 13, color: 'var(--rz-success)', lineHeight: 1.5 }}>
                <strong>Tu reserva está confirmada.</strong> El monto permanece protegido por Rezervame hasta completar el servicio.
              </div>
            </div>
          ) : null}

          {/* when */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, padding: '12px 14px', background: 'var(--rz-gray-050)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ width: 38, height: 38, flex: 'none', borderRadius: 10, background: '#fff', color: 'var(--rz-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Glyph name="calendar" size={19} /></span>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--rz-navy)' }}>{res.dateLabel}</div>
              <div style={{ fontSize: 13, color: 'var(--rz-gray-500)', marginTop: 1 }}>{res.timeRange} · {res.durationLabel}</div>
            </div>
          </div>

          {/* who the reservation is for */}
          {(() => {
            const r = recipientInfo(res);
            const text = r.kind === 'one' ? r.name : r.kind === 'multi' ? `${r.count} personas` : 'Ti';
            const sub = r.kind === 'multi' ? 'Cada servicio indica para quién es.' : r.kind === 'one' ? 'Reservaste esta cita para otra persona.' : 'Reservaste esta cita para ti.';
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, padding: '12px 14px', background: 'var(--rz-gray-050)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ width: 38, height: 38, flex: 'none', borderRadius: 10, background: '#fff', color: 'var(--rz-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Glyph name="user" size={19} /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--rz-navy)' }}>Reserva para: {text}</div>
                  <div style={{ fontSize: 13, color: 'var(--rz-gray-500)', marginTop: 1 }}>{sub}</div>
                </div>
              </div>
            );
          })()}

          {/* services */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rz-coral)', margin: '20px 0 10px' }}>Servicios</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recipientInfo(res).kind === 'multi' ? (() => {
              const order = []; const byFor = {};
              res.services.forEach((s) => { const k = s.for || 'self'; if (!byFor[k]) { byFor[k] = []; order.push(k); } byFor[k].push(s); });
              return order.map((k) => (
                <PersonBookingGroup key={k} self={k === 'self'} name={k === 'self' ? 'Para mí' : k}
                  services={byFor[k].map((s) => ({ name: s.name, meta: `${s.pro} · ${s.duration} min`, price: money(s.price) }))} />
              ));
            })() : res.services.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-navy)' }}>{s.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', marginTop: 2 }}>{s.pro} · {s.duration} min</div>
                </div>
                <span style={{ flex: 'none', fontWeight: 700, color: 'var(--rz-navy)' }}>{money(s.price)}</span>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '16px 0' }} />
          {row('Subtotal', money(res.subtotal))}
          {res.tip > 0 && row('Propina', money(res.tip))}
          {row('Total', money(res.total), true)}

          {/* payment */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 16, padding: '12px 14px', background: 'var(--rz-gray-050)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: 'var(--rz-navy)' }}><Glyph name="creditCard" size={16} style={{ color: 'var(--rz-coral)' }} /> {res.paymentMethod}</span>
            <PayStatusChip status={res.paymentStatus} size="md" />
          </div>

          {/* cancellation policy */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14, padding: '12px 14px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <Glyph name="shield" size={16} style={{ color: 'var(--rz-coral)', flex: 'none', marginTop: 1 }} />
            <div style={{ fontSize: 12.5, color: 'var(--rz-gray-600)', lineHeight: 1.5 }}>
              Puedes cancelar o reagendar hasta <strong style={{ color: 'var(--rz-navy)' }}>60 minutos antes</strong>. Cancelaciones tardías o no presentarse pueden generar un cargo de hasta {res.cancelFeePct}% del total.
            </div>
          </div>

          {/* actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            {res.status === 'pending' && <Button variant="dark" leftIcon="lock" style={{ flex: '1 1 160px' }} onClick={onClose}>Completar pago</Button>}
            {canMod && <Button variant="primary" leftIcon="edit" style={{ flex: '1 1 150px' }} onClick={() => onReschedule(res)}>Reagendar</Button>}
            {canMod && <Button variant="outline" leftIcon="close" style={{ flex: '1 1 150px' }} onClick={() => onCancel(res)}>Cancelar cita</Button>}
            {(res.status === 'completed' || res.status === 'cancelled' || res.status === 'noshow') && <Button variant="primary" style={{ flex: '1 1 160px' }} onClick={() => onRebook(res)}>Reservar de nuevo</Button>}
            {A.isUpcomingState(res) && res.status !== 'pending' && !canMod && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--rz-gray-500)' }}><Glyph name="clock" size={14} /> Ya no es posible cancelar o reagendar esta cita.</div>
            )}
          </div>
        </div>
      </Modal>
    );
  }

  // ---- cancel confirmation ----
  function CancelConfirm({ res, onClose, onConfirm }) {
    if (!res) return null;
    return (
      <Modal open={!!res} onClose={onClose} width={420}>
        <div style={{ padding: 'clamp(26px,4vw,32px)', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%', background: 'var(--rz-coral-050)', color: 'var(--rz-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Glyph name="close" size={26} /></div>
          <h2 style={{ fontSize: 21, fontWeight: 700, color: 'var(--rz-navy)' }}>¿Cancelar esta cita?</h2>
          <p style={{ fontSize: 14, color: 'var(--rz-gray-500)', marginTop: 10, lineHeight: 1.55 }}>
            Tu cita en <strong style={{ color: 'var(--rz-navy)' }}>{res.business}</strong> del {res.dateLabel} será cancelada. Como cancelas con más de 60 minutos de anticipación, no se aplicará ningún cargo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            <Button variant="dark" size="lg" fullWidth onClick={onConfirm}>Sí, cancelar cita</Button>
            <Button variant="outline" size="lg" fullWidth onClick={onClose}>Mantener cita</Button>
          </div>
        </div>
      </Modal>
    );
  }

  // ---- main tab ----
  function AccountReservations({ onReschedule, onRebook }) {
    const [list, setList] = React.useState(() => RZ.account.reservations);
    const [filter, setFilter] = React.useState('todas');
    const [query, setQuery] = React.useState('');
    const [details, setDetails] = React.useState(null);
    const [cancelling, setCancelling] = React.useState(null);
    const [toast, setToast] = React.useState(null);

    const FILTERS = [
      { value: 'todas', label: 'Todas' },
      { value: 'proximas', label: 'Próximas' },
      { value: 'completadas', label: 'Completadas' },
      { value: 'canceladas', label: 'Canceladas' },
    ];
    const matchFilter = (r) => filter === 'todas'
      || (filter === 'proximas' && ['upcoming', 'confirmed', 'pending'].includes(r.status))
      || (filter === 'completadas' && r.status === 'completed')
      || (filter === 'canceladas' && ['cancelled', 'noshow'].includes(r.status));
    const matchQuery = (r) => !query.trim()
      || r.business.toLowerCase().includes(query.toLowerCase())
      || r.services.some((s) => s.name.toLowerCase().includes(query.toLowerCase()));
    const shown = list.filter((r) => matchFilter(r) && matchQuery(r));

    const countFor = (f) => list.filter((r) => {
      if (f === 'todas') return true;
      if (f === 'proximas') return ['upcoming', 'confirmed', 'pending'].includes(r.status);
      if (f === 'completadas') return r.status === 'completed';
      return ['cancelled', 'noshow'].includes(r.status);
    }).length;

    const doCancel = () => {
      const id = cancelling.id;
      setList((l) => l.map((r) => r.id === id ? { ...r, status: 'cancelled', paymentStatus: 'Reembolsado' } : r));
      setCancelling(null); setDetails(null);
      setToast({ tone: 'success', title: 'Cita cancelada', message: 'Tu reserva fue cancelada sin cargo.' });
      setTimeout(() => setToast(null), 3500);
    };
    const rebook = (res) => { setDetails(null); if (onRebook) onRebook(res); else onReschedule && onReschedule(); };

    return (
      <div>
        {/* filters + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            {FILTERS.map((f) => (
              <Chip key={f.value} active={filter === f.value} count={countFor(f.value)} onClick={() => setFilter(f.value)}>{f.label}</Chip>
            ))}
          </div>
          <div style={{ minWidth: 300, flex: '0 1 340px' }}>
            <Input icon="search" placeholder="Buscar por negocio o servicio" value={query} onChange={(e) => setQuery(e.target.value)} size="sm" />
          </div>
        </div>

        {shown.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, margin: '0 auto 14px', borderRadius: '50%', background: 'var(--rz-gray-100)', color: 'var(--rz-gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Glyph name="calendar" size={26} /></div>
            <h4 style={{ fontSize: 17, fontWeight: 700, color: 'var(--rz-navy)' }}>No hay reservas aquí</h4>
            <p style={{ fontSize: 14, color: 'var(--rz-gray-500)', marginTop: 6 }}>Prueba con otro filtro o término de búsqueda.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {shown.map((r) => (
              <ReservationCard key={r.id} res={r}
                onDetails={setDetails}
                onReschedule={() => onReschedule && onReschedule()}
                onCancel={setCancelling}
                onRebook={(r) => { if (onRebook) onRebook(r); else onReschedule && onReschedule(); }} />
            ))}
          </div>
        )}

        <ReservationDetails res={details} onClose={() => setDetails(null)}
          onReschedule={() => { setDetails(null); onReschedule && onReschedule(); }}
          onCancel={(r) => setCancelling(r)} onRebook={rebook} />
        <CancelConfirm res={cancelling} onClose={() => setCancelling(null)} onConfirm={doCancel} />

        {toast && (
          <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 200, maxWidth: 360 }}>
            <Toast tone={toast.tone} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
          </div>
        )}
        <style>{`@keyframes rz-pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
      </div>
    );
  }

  window.AccountReservations = AccountReservations;
  window.RZAccountWidgets = { Menu, MenuItem, CalendarButton, ShareButton, PayStatusChip, money };
})();
