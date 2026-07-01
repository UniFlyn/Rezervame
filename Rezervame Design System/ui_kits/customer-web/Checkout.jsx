/* Checkout / Pago page — the ONLINE payment surface only.
   Reached solely when an online payment is required or selected on the Reservar page,
   so it offers exactly two methods: Tarjeta and Yappy. "Pago en el local" never
   appears here — local (POS) bookings are confirmed directly on the Reservar page and
   never reach this screen. The optional tip lives only in this online checkout.
   "¡Reserva exitosa!" appears only after the online payment is approved. */
function Checkout({ order, onPaid, onHome, onBack, onAccount, onFavorites, onLogout }) {
  const DS = window.RezervameDesignSystem_4317c4;
  const { Header, Input, Button, Checkbox, BrandIcon, Glyph, BookingConfirmation } = DS;
  const RZ = window.RZ;
  const logo = '../../assets/logos/rezervame-color.png';

  // Fall back to a demo order so the standalone "Pago" tab still renders.
  const ord = order || {
    business: 'Luxe Hair Studio', location: 'Av. Balboa, Ciudad de Panamá',
    dateLabel: '15 noviembre 2025', datetime: '15 noviembre 2025 · 2:00 PM',
    startISO: '2025-11-15T19:00:00.000Z', endISO: '2025-11-15T22:00:00.000Z',
    reservationUrl: 'https://rezervame.app/mis-reservas',
    professionals: ['Sofía Herrera', 'Diego Mendoza', 'Mateo Ríos'],
    services: [
      { name: 'Corte de cabello para mujer', price: 65, pro: 'Sofía Herrera', time: '2:00 PM – 3:00 PM' },
      { name: 'Highlights', price: 140, pro: 'Diego Mendoza', time: '3:00 PM – 4:30 PM' },
      { name: 'Corte de cabello para hombre', price: 35, pro: 'Mateo Ríos', time: '4:30 PM – 5:00 PM' },
    ],
    subtotal: 240,
  };

  // Online-only payment methods. "Pago en el local" is intentionally absent.
  const methods = [
    { id: 'credit', label: 'Tarjeta', icon: 'creditCard', cta: 'Pagar y confirmar reserva', full: 'Tarjeta de crédito / débito' },
    { id: 'yappy', label: 'Yappy', icon: 'sparkles', cta: 'Pagar con Yappy', full: 'Yappy' },
  ];

  const [method, setMethod] = React.useState('credit');
  const [save, setSave] = React.useState(true);
  const [tip, setTip] = React.useState('none');           // none | 10 | 15 | 20 | custom
  const [customTip, setCustomTip] = React.useState('');
  // ---- card fields (all controlled so they can be validated) ----
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiry, setExpiry] = React.useState('');
  const [cvv, setCvv] = React.useState('');
  const [cardName, setCardName] = React.useState('');
  const [postal, setPostal] = React.useState('');
  // Postal code is optional for Panama; flip to true only when the gateway demands
  // AVS (address verification). When false the field never blocks payment.
  const postalRequired = false;
  const [fieldErrors, setFieldErrors] = React.useState({}); // per-field validation messages
  const [yappyConfirmed, setYappyConfirmed] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  // payError is reserved for REAL payment failures (decline / gateway / Yappy):
  // null | 'card' | 'yappy'. Missing-field problems use fieldErrors instead.
  const [payError, setPayError] = React.useState(null);
  const [done, setDone] = React.useState(false);          // success modal

  // Light input formatting.
  const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };
  const clearErr = (k) => setFieldErrors((p) => (p[k] ? { ...p, [k]: undefined } : p));
  const [vw, setVw] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  React.useEffect(() => { const f = () => setVw(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  const stacked = vw < 920;

  const m = methods.find((x) => x.id === method) || methods[0];
  const subtotal = ord.subtotal != null ? ord.subtotal : ord.services.reduce((t, s) => t + (Number(s.price) || 0), 0);
  const tipAmount = tip === 'custom' ? Math.max(0, parseFloat(customTip) || 0)
    : tip === 'none' ? 0 : Math.round(subtotal * (Number(tip) / 100) * 100) / 100;
  const total = Math.round((subtotal + tipAmount) * 100) / 100;
  const money = (n) => `$${Number(n).toFixed(2)}`;

  const hora = (ord.services.find((s) => s.time)?.time || '').split('–')[0].trim() || ord.datetime;

  // Validate the card form. Returns a {field: message} map (empty = valid).
  const validateCard = () => {
    const e = {};
    const digits = cardNumber.replace(/\D/g, '');
    if (!digits) e.cardNumber = 'Ingresa el número de tarjeta.';
    else if (digits.length < 15) e.cardNumber = 'Revisa los datos de tu tarjeta.';
    if (!expiry.trim()) e.expiry = 'Ingresa la fecha de expiración.';
    else if (!/^\d{2}\/\d{2}$/.test(expiry.trim())) e.expiry = 'Revisa la fecha de expiración.';
    if (!cvv.trim()) e.cvv = 'Ingresa el CVV.';
    else if (cvv.replace(/\D/g, '').length < 3) e.cvv = 'Revisa el CVV.';
    if (!cardName.trim()) e.cardName = 'Ingresa el nombre en la tarjeta.';
    // Postal code is optional in Panama — only enforced if the gateway requires it (AVS).
    if (postalRequired && !postal.trim()) e.postal = 'Ingresa el código postal.';
    return e;
  };

  const FIELD_IDS = { cardNumber: 'cc-number', expiry: 'cc-exp', cvv: 'cc-cvv', cardName: 'cc-name', postal: 'cc-postal' };

  const pay = () => {
    setPayError(null);

    // ---- Yappy: never validate card fields; only the confirmation flow ----
    if (method === 'yappy') {
      setProcessing(true);
      setTimeout(() => {
        setProcessing(false);
        if (!yappyConfirmed) { setPayError('yappy'); return; } // confirmation not completed
        setDone(true);
      }, 1000);
      return;
    }

    // ---- Card: validate required fields BEFORE any payment attempt ----
    const errs = validateCard();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      // Focus the first invalid field — no payment is attempted, no generic error.
      const firstKey = ['cardNumber', 'expiry', 'cvv', 'cardName', 'postal'].find((k) => errs[k]);
      const el = firstKey && document.getElementById(FIELD_IDS[firstKey]);
      if (el) el.focus();
      return;
    }

    // Fields valid → attempt the (mock) payment. Generic error only on a real decline.
    setFieldErrors({});
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const digits = cardNumber.replace(/\D/g, '');
      if (digits === '4000000000000002') { setPayError('card'); return; } // declined test card
      setDone(true);
    }, 1200);
  };

  // Clean service names for the confirmation modal — professionals are shown
  // separately (ord.professionals), so they are not concatenated here.
  const confirmServices = ord.services
    .filter((s) => s.pro || s.name)
    .map((s) => s.name);

  return (
    <div style={{ background: 'var(--rz-gray-050)', minHeight: '100vh' }}>
      <Header logoSrc={logo} notifications user={RZ.user} onLogoClick={onHome} contextTitle="Pago seguro" {...RZ.loggedInHeaderProps({ onAccount, onFavorites, onLogout })} />
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ background: 'var(--rz-gray-100)', borderRadius: 'var(--radius-2xl)', padding: 20 }}>
          {/* Logo card */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '22px 28px', marginBottom: 18 }}>
            <img src={logo} alt="Rezervame" style={{ height: 34 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: stacked ? '1fr' : 'minmax(0,1fr) 380px', gap: 18, alignItems: 'stretch' }}>
            {/* Payment form */}
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, display: 'flex', flexDirection: 'column' }}>
              {onBack && (
                <button onClick={onBack} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 16,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--rz-gray-500)',
                }}>
                  <Glyph name="chevronLeft" size={16} /> Volver a la reserva
                </button>
              )}

              <div style={{ fontSize: 14, color: 'var(--rz-gray-500)' }}>Monto a pagar</div>
              <div style={{ fontSize: 38, fontWeight: 700, color: 'var(--rz-navy)', marginBottom: 24 }}>{money(total)}</div>

              {/* Method tabs — online methods only */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${methods.length}, 1fr)`, borderBottom: '1px solid var(--border-subtle)', marginBottom: 24 }}>
                {methods.map((mm) => (
                  <button key={mm.id} onClick={() => { setMethod(mm.id); setPayError(null); setFieldErrors({}); }} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 0 14px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: method === mm.id ? 'var(--rz-coral)' : 'var(--rz-gray-500)',
                    borderBottom: `2px solid ${method === mm.id ? 'var(--rz-coral)' : 'transparent'}`, marginBottom: -1,
                  }}>
                    {mm.id === 'yappy'
                      ? <img src="../../assets/logos/yappy-color.png" alt="Yappy" style={{ height: 42, display: 'block' }} />
                      : <>
                          <Glyph name={mm.icon} size={22} />
                          <span style={{ fontSize: 15, fontWeight: 700 }}>{mm.label}</span>
                        </>}
                  </button>
                ))}
              </div>

              {/* Method body */}
              {method === 'credit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <Input id="cc-number" label="Número de tarjeta" placeholder="1234 5678 9000 0000" inputMode="numeric" value={cardNumber} error={fieldErrors.cardNumber}
                    onChange={(e) => { setCardNumber(fmtCard(e.target.value)); clearErr('cardNumber'); setPayError(null); }}
                    trailing={<div style={{ display: 'flex', gap: 6 }}><BrandIcon name="PaymentMethodVisaSize24" size={28} /><BrandIcon name="PaymentMethodMastercardSize24" size={28} /><BrandIcon name="PaymentMethodAmexSize24" size={28} /></div>} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                    <Input id="cc-exp" label="Fecha exp." placeholder="MM/YY" inputMode="numeric" value={expiry} error={fieldErrors.expiry}
                      onChange={(e) => { setExpiry(fmtExp(e.target.value)); clearErr('expiry'); setPayError(null); }} />
                    <Input id="cc-cvv" label="CVV" placeholder="123" inputMode="numeric" value={cvv} error={fieldErrors.cvv}
                      onChange={(e) => { setCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); clearErr('cvv'); setPayError(null); }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                    <Input id="cc-name" label="Nombre en la tarjeta" placeholder="Nombre Apellido" value={cardName} error={fieldErrors.cardName}
                      onChange={(e) => { setCardName(e.target.value); clearErr('cardName'); setPayError(null); }} />
                    <Input id="cc-postal" label={postalRequired ? 'Código postal' : 'Código postal (opcional)'} placeholder="12345" inputMode="numeric" value={postal} error={fieldErrors.postal}
                      onChange={(e) => { setPostal(e.target.value.replace(/[^0-9-]/g, '').slice(0, 10)); clearErr('postal'); setPayError(null); }} />
                  </div>
                  <Checkbox checked={save} onChange={setSave} label="Guardar este método de pago para futuras reservas." />
                </div>
              )}
              {method === 'yappy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '4px 0 0' }}>
                    <div style={{ flex: 'none', width: 116, height: 116, borderRadius: 'var(--radius-lg)', background: 'var(--rz-gray-050)', border: '1.5px dashed var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="../../assets/logos/yappy-color.png" alt="Yappy" style={{ width: 86, display: 'block' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--rz-navy)' }}>Confirma el pago en Yappy</div>
                      <p style={{ fontSize: 13.5, color: 'var(--rz-gray-500)', marginTop: 6, lineHeight: 1.55 }}>Escanea el código o abre la app de Yappy. Al confirmar el pago, Rezervame registrará tu reserva automáticamente.</p>
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: payError === 'yappy' ? 'var(--rz-warning-bg)' : 'var(--rz-gray-050)', border: `1px solid ${payError === 'yappy' ? 'var(--rz-warning)' : 'var(--border-subtle)'}`, transition: 'all var(--dur-base)' }}>
                    <Checkbox checked={yappyConfirmed} onChange={(v) => { setYappyConfirmed(v); setPayError(null); }} label="Ya confirmé el pago en la app de Yappy." />
                  </div>
                </div>
              )}

              {/* Optional tip — online checkout only */}
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--rz-navy)' }}>Propina</span>
                  <span style={{ fontSize: 12.5, color: 'var(--rz-gray-400)' }}>Opcional</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[{ id: 'none', label: 'Sin propina' }, { id: '10', label: '10%' }, { id: '15', label: '15%' }, { id: '20', label: '20%' }, { id: 'custom', label: 'Personalizado' }].map((t) => {
                    const sel = tip === t.id;
                    return (
                      <button key={t.id} onClick={() => setTip(t.id)} style={{
                        flex: '0 1 auto', minWidth: 56, height: 40, padding: '0 16px', cursor: 'pointer',
                        borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600,
                        background: sel ? 'var(--rz-coral)' : '#fff', color: sel ? '#fff' : 'var(--rz-gray-700)',
                        border: `1.5px solid ${sel ? 'var(--rz-coral)' : 'var(--border-default)'}`,
                      }}>{t.label}</button>
                    );
                  })}
                </div>
                {tip === 'custom' && (
                  <div style={{ marginTop: 12, maxWidth: 220 }}>
                    <Input placeholder="Monto $0.00" value={customTip} onChange={(e) => setCustomTip(e.target.value.replace(/[^0-9.]/g, ''))} />
                  </div>
                )}
              </div>

              <p style={{ fontSize: 12, color: 'var(--rz-gray-500)', lineHeight: 1.5, marginTop: 22 }}>
                Al seleccionar {m.cta}, aceptas los Términos del servicio y la Política de cancelación. Autorizas a Rezervame a realizar una retención temporal de {money(total)} en tu método de pago para {ord.dateLabel}. El cobro final se realizará al completar el servicio.
              </p>

              {payError && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, padding: '12px 14px', background: 'var(--rz-warning-bg)', border: '1px solid var(--rz-warning)', borderRadius: 'var(--radius-md)' }}>
                  <Glyph name="helpCircle" size={17} style={{ color: 'var(--rz-warning)', flex: 'none', marginTop: 1 }} />
                  <span style={{ fontSize: 13.5, color: 'var(--rz-navy)', lineHeight: 1.5 }}>
                    {payError === 'yappy'
                      ? 'No pudimos confirmar tu pago con Yappy. Abre la app de Yappy y confirma el pago para continuar.'
                      : 'No pudimos procesar el pago. Intenta nuevamente o elige otro método.'}
                  </span>
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: 22 }}>
                <Button variant="primary" size="lg" fullWidth leftIcon="lock" loading={processing} onClick={pay}>
                  {processing ? 'Procesando…' : `${m.cta} · ${money(total)}`}
                </Button>
                <p style={{ fontSize: 12, color: 'var(--rz-gray-400)', textAlign: 'center', marginTop: 12 }}>Pago protegido y registrado por Rezervame · © 2026</p>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Business + appointment */}
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--rz-navy)', marginBottom: 16 }}>{ord.business}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SumRow label="Fecha de la cita" value={ord.dateLabel} />
                <SumRow label="Hora" value={hora} />
                {ord.location && <SumRow label="Ubicación" value={ord.location} />}
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '18px 0' }} />

              {/* Services */}
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rz-coral)', marginBottom: 12 }}>Tu reserva</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ord.services.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: 'var(--rz-gray-700)', fontWeight: 600 }}>{it.name}</div>
                      {it.pro && <div style={{ fontSize: 12, color: 'var(--rz-gray-500)', marginTop: 2 }}>{it.pro}{it.time ? ` · ${it.time}` : ''}</div>}
                    </div>
                    <span style={{ flex: 'none', fontWeight: 700, color: 'var(--rz-navy)' }}>{money(it.price)}</span>
                  </div>
                ))}
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '18px 0' }} />

              {/* Totals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <SumRow label="Subtotal" value={money(subtotal)} plain />
                <SumRow label={`Propina${tip !== 'none' && tip !== 'custom' ? ` (${tip}%)` : ''}`} value={money(tipAmount)} plain />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, paddingTop: 14, borderTop: '1.5px solid var(--rz-navy)' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--rz-navy)' }}>Total</span>
                <span style={{ fontSize: 27, fontWeight: 700, color: 'var(--rz-coral)' }}>{money(total)}</span>
              </div>

              {/* Selected method */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 16, padding: '11px 14px', background: 'var(--rz-gray-050)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 12.5, color: 'var(--rz-gray-500)' }}>Método de pago</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'var(--rz-navy)' }}>
                  {method === 'yappy'
                    ? <img src="../../assets/logos/yappy-icon.png" alt="" style={{ height: 15, display: 'block' }} />
                    : <Glyph name={m.icon} size={15} style={{ color: 'var(--rz-coral)' }} />} {m.full}
                </span>
              </div>

              {/* Bottom-anchored trust + supporting notes (balances the column height) */}
              <div style={{ marginTop: 'auto', paddingTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--rz-success-bg, var(--rz-gray-050))', borderRadius: 'var(--radius-md)', color: 'var(--rz-success)' }}>
                  <Glyph name="shield" size={26} style={{ flex: 'none' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--rz-navy)' }}>Pago protegido</div>
                    <div style={{ fontSize: 12, color: 'var(--rz-gray-500)' }}>Procesado y registrado por Rezervame</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                  {['Pago procesado y registrado por Rezervame.', 'Recibirás la confirmación de tu reserva al completar el pago.'].map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--rz-gray-500)', lineHeight: 1.5 }}>
                      <Glyph name="check" size={13} style={{ flex: 'none', marginTop: 2, color: 'var(--rz-gray-400)' }} /> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookingConfirmation
        open={done}
        onClose={() => setDone(false)}
        business={ord.business}
        services={confirmServices}
        professionals={ord.professionals}
        datetime={ord.datetime}
        location={ord.location}
        startISO={ord.startISO}
        endISO={ord.endISO}
        reservationUrl={ord.reservationUrl}
        subtitle={`Tu pago con ${m.full} fue procesado y registrado en Rezervame. Tu cita está confirmada.`}
        secondaryLabel="Volver al inicio"
        primaryLabel="Ver mis reservas"
        onSecondary={() => { setDone(false); onHome(); }}
        onPrimary={() => { setDone(false); onPaid(); }}
      />
    </div>
  );

  function SumRow({ label, value, plain }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0', fontSize: 14 }}>
        <span style={{ color: plain ? 'var(--rz-gray-600)' : 'var(--rz-gray-500)', flex: 'none' }}>{label}</span>
        <span style={{ fontWeight: 700, color: 'var(--rz-navy)', textAlign: 'right' }}>{value}</span>
      </div>
    );
  }
}
window.Checkout = Checkout;
