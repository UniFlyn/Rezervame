/* Account — the customer's dashboard: profile header, 5 tabs (reservations,
   invoices, favorites, payment methods, settings). Reservation, payments and
   settings tabs live in AccountReservations.jsx / AccountExtras.jsx. */
function Account({ onHome, onAccount, onFavorites, onLogout, onReserve, initialTab, tabNonce, notifications, onMarkNotificationRead, onMarkAllNotificationsRead, onNotificationClick, reviewedIds, onMarkReviewed, reviewReq } = {}) {
  const DS = window.RezervameDesignSystem_4317c4;
  const { Header, Footer, Tabs, Badge, Button, Avatar, Glyph, Toast } = DS;
  const RZ = window.RZ;
  const logo = '../../assets/logos/rezervame-color.png';
  const logoW = '../../assets/logos/rezervame-white.png';
  const [tab, setTab] = React.useState(initialTab || 'reservas');
  const [toast, setToast] = React.useState(null);
  const [review, setReview] = React.useState({ open: false, reservation: null, notifId: null });
  const goBook = onReserve || onHome || (() => {});
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  // Honour an externally-requested tab (e.g. header “Ver todas” → Notificaciones).
  // tabNonce changes on every request so repeat clicks re-select even when the
  // Account screen is already mounted.
  React.useEffect(() => { if (initialTab) setTab(initialTab); }, [tabNonce]);

  // Open the review modal for a specific completed reservation.
  const openReview = (notif) => {
    const res = (RZ.account.reservations || []).find((r) => r.id === notif.reservationId);
    if (!res) return;
    setReview({ open: true, reservation: res, notifId: notif.id });
  };
  const submitReview = ({ rating, comment, tags }) => {
    if (review.reservation && onMarkReviewed) onMarkReviewed(review.reservation.id);
    if (review.notifId && onMarkNotificationRead) onMarkNotificationRead(review.notifId);
  };
  // Header-triggered review (clicked from another page → land on Account + open modal).
  React.useEffect(() => {
    if (reviewReq && reviewReq.reservationId) {
      setTab('notificaciones');
      const already = (reviewedIds || []).includes(reviewReq.reservationId);
      const res = (RZ.account.reservations || []).find((r) => r.id === reviewReq.reservationId);
      if (res && !already) setReview({ open: true, reservation: res, notifId: reviewReq.notifId });
    }
  }, [reviewReq && reviewReq.n]);

  const notifUnread = (notifications || []).filter((n) => n.unread).length;

  const A = RZ.account;
  const u = A.user;
  const upcomingCount = A.reservations.filter((r) => A.isUpcomingState(r)).length;

  // ---- invoices (custom list: payment method + non-wrapping invoice number) ----
  const INV_STATUS = {
    paid: { label: 'Pagada', tone: 'success' },
    pending: { label: 'Pendiente', tone: 'warning' },
    refunded: { label: 'Reembolsada', tone: 'neutral' },
    cancelled: { label: 'Cancelada', tone: 'error' },
  };
  const downloadInvoice = (inv) => {
    const body = [
      'REZERVAME — Factura', '====================', '',
      `Número:  ${inv.id}`, `Negocio: ${inv.business}`, `Fecha:   ${inv.date}`,
      `Método:  ${inv.method}`, `Monto:   $${Number(inv.amount).toFixed(2)}`,
      `Estado:  ${INV_STATUS[inv.status].label}`, '', 'Gracias por reservar con Rezervame.',
    ].join('\n');
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${inv.id.replace('#', '')}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const InvoiceRow = ({ inv }) => {
    const s = INV_STATUS[inv.status];
    return (
      <div className="rz-inv-row rz-inv-grid">
        <span className="rz-inv-code">{inv.id}</span>
        <div className="rz-inv-biz">
          <div className="rz-inv-name">{inv.business}</div>
          <div className="rz-inv-meta">{inv.date} · {inv.method}</div>
        </div>
        <span className="rz-inv-amount">${Number(inv.amount).toFixed(2)}</span>
        <div className="rz-inv-status"><Badge tone={s.tone}>{s.label}</Badge></div>
        <div className="rz-inv-action"><Button variant="outline" size="sm" leftIcon="download" onClick={() => downloadInvoice(inv)}>Descargar</Button></div>
      </div>
    );
  };

  const notifTabLabel = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      Notificaciones
      {notifUnread > 0 && (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: 'var(--rz-coral)', color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>{notifUnread}</span>
      )}
    </span>
  );

  const tabs = [
    { label: 'Mis reservas', value: 'reservas' },
    { label: 'Mis facturas', value: 'facturas' },
    { label: 'Favoritos', value: 'favoritos' },
    { label: 'Familia y amigos', value: 'personas' },
    { label: 'Métodos de pago', value: 'pagos' },
    { label: notifTabLabel, value: 'notificaciones' },
    { label: 'Configuración', value: 'config' },
  ];

  return (
    <div style={{ background: 'var(--rz-gray-050)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header logoSrc={logo} notifications user={RZ.user} onLogoClick={onHome} {...RZ.loggedInHeaderProps({ onAccount, onFavorites, onLogout })} />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 64px', width: '100%', flex: 1 }}>

        {/* ---- profile header ---- */}
        <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)', padding: 'clamp(20px,3vw,28px)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <Avatar src={u.avatar} name={u.name} size={76} ring />
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontSize: 'clamp(24px,3.5vw,30px)', lineHeight: 1.1 }}>{u.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--rz-gray-500)' }}><Glyph name="mail" size={14} /> {u.email}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--rz-gray-500)' }}><Glyph name="phone" size={14} /> {u.phone}</span>
              </div>
            </div>
          </div>
          {/* stats */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
            {[
              { icon: 'checkCircle', value: u.reservations, label: 'Reservas totales' },
              { icon: 'calendar', value: upcomingCount, label: 'Próximas citas' },
              { icon: 'heart', value: A.favorites.length, label: 'Favoritos' },
            ].map((s, i) => (
              <div key={i} style={{ flex: '1 1 140px', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--rz-gray-050)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ width: 40, height: 40, flex: 'none', borderRadius: 10, background: '#fff', color: 'var(--rz-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Glyph name={s.icon} size={19} /></span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--rz-gray-500)', marginTop: 3 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- tabs (scrollable on mobile) ---- */}
        <div style={{ marginBottom: 24, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 'max-content' }}>
            <Tabs value={tab} onChange={setTab} items={tabs} />
          </div>
        </div>

        {tab === 'reservas' && <AccountReservations onReschedule={goBook} onRebook={(res) => (onReserve ? onReserve({ reservation: res }) : goBook())} />}

        {tab === 'facturas' && (
          <div>
            <style>{`
              .rz-inv-grid {
                display: grid;
                grid-template-columns: 92px minmax(0,1fr) 116px 128px 136px;
                grid-template-areas: "code business amount status action";
                align-items: center;
                column-gap: 20px;
                padding: 16px 22px;
              }
              .rz-inv-head {
                font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
                text-transform: uppercase; color: var(--rz-gray-500);
                background: var(--rz-gray-050);
                border-bottom: 1px solid var(--border-subtle);
                padding-top: 12px; padding-bottom: 12px;
              }
              .rz-inv-row + .rz-inv-row { border-top: 1px solid var(--border-subtle); }
              .rz-inv-code { grid-area: code; font-size: 14px; font-weight: 700; color: var(--rz-navy); white-space: nowrap; font-variant-numeric: tabular-nums; }
              .rz-inv-biz { grid-area: business; min-width: 0; }
              .rz-inv-name { font-size: 14px; font-weight: 600; color: var(--rz-navy); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
              .rz-inv-meta { font-size: 12.5px; color: var(--rz-gray-500); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
              .rz-inv-amount { grid-area: amount; font-size: 15px; font-weight: 700; color: var(--rz-navy); text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
              .rz-inv-status { grid-area: status; justify-self: start; }
              .rz-inv-action { grid-area: action; justify-self: end; }
              .rz-inv-head .h-amount { text-align: right; }
              .rz-inv-head .h-action { text-align: right; }
              @media (max-width: 760px) {
                .rz-inv-head { display: none; }
                .rz-inv-grid {
                  grid-template-columns: 1fr auto;
                  grid-template-areas:
                    "code amount"
                    "business business"
                    "status action";
                  row-gap: 12px; column-gap: 12px;
                  padding: 18px;
                  align-items: start;
                }
                .rz-inv-amount { align-self: start; }
                .rz-inv-name { white-space: normal; }
                .rz-inv-meta { white-space: normal; }
                .rz-inv-status, .rz-inv-action { align-self: center; }
              }
            `}</style>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 22 }}>Mis facturas</h2>
              <p style={{ fontSize: 14, color: 'var(--rz-gray-500)', marginTop: 4 }}>Descarga y revisa tu historial de transacciones.</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--rz-gray-500)', borderBottom: '1px solid var(--border-subtle)' }}>
                <Glyph name="creditCard" size={15} style={{ color: 'var(--rz-coral)' }} /> {A.invoices.length} facturas
              </div>
              <div className="rz-inv-head rz-inv-grid" aria-hidden="true">
                <span style={{ gridArea: 'code' }}>Factura</span>
                <span style={{ gridArea: 'business' }}>Negocio</span>
                <span className="h-amount" style={{ gridArea: 'amount' }}>Monto</span>
                <span style={{ gridArea: 'status' }}>Estado</span>
                <span className="h-action" style={{ gridArea: 'action' }}>Acción</span>
              </div>
              {A.invoices.map((inv) => <InvoiceRow key={inv.id} inv={inv} />)}
            </div>
          </div>
        )}

        {tab === 'favoritos' && <AccountFavorites onReserve={goBook} />}

        {tab === 'personas' && <AccountPeople />}

        {tab === 'pagos' && <AccountPayments />}

        {tab === 'notificaciones' && (
          <AccountNotifications
            items={notifications || []}
            onItemClick={onNotificationClick}
            onMarkRead={onMarkNotificationRead}
            onMarkAllRead={onMarkAllNotificationsRead}
            onExplore={goBook}
            onReview={openReview}
            reviewedIds={reviewedIds || []}
          />
        )}

        {tab === 'config' && <AccountSettings onGoPayments={() => setTab('pagos')} onLogout={onLogout} />}
      </div>
      <Footer logoSrc={logoW} columns={RZ.footerColumns} socials={['instagram', 'facebook', 'linkedin', 'x']} contentMax="min(94vw, 1600px)" />
      <AccountReviewModal
        open={review.open}
        reservation={review.reservation}
        onClose={() => setReview((r) => ({ ...r, open: false }))}
        onSubmit={submitReview}
      />
      {toast && <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 200, maxWidth: 360 }}><Toast tone={toast.tone} title={toast.title} message={toast.message} onClose={() => setToast(null)} /></div>}
    </div>
  );
}
window.Account = Account;
