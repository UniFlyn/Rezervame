/* Booking flow — pick service(s), professional, date & time. The CTA hands the
   built order to the Checkout page (the payment step), which registers payment and
   shows the "¡Reserva exitosa!" confirmation. Uses the DS ReservationSummary. */
// Module-scope so its identity is stable across renders — a Panel defined inside
// Booking would be a new component type every render, remounting its children
// (and resetting DateSelector's window state on each date click).
function Panel({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)', padding: 22 }}>
      <h3 style={{ fontSize: 18, marginBottom: 16 }}>{title}</h3>
      {children}
    </div>
  );
}
function Booking({ onProceedToPayment, onHome, onAccount, onFavorites, onLogout, initialService, initialProName, initialReservation, ...rest }) {
  const DS = window.RezervameDesignSystem_4317c4;
  const { Header, DateSelector, TimeSlotSelector, Avatar, Glyph, Rating, ReservationSummary, Input, Button, Modal, RecipientPicker, RecipientBadge, PersonBookingGroup } = DS;
  const RZ = window.RZ;
  const logo = '../../assets/logos/rezervame-color.png';

  // ---- responsive ----
  const [vw, setVw] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  React.useEffect(() => {
    const o = () => setVw(window.innerWidth);
    window.addEventListener('resize', o, { passive: true });
    return () => window.removeEventListener('resize', o);
  }, []);
  const twoCol = vw >= 960;
  const staffCols = vw < 560 ? 2 : vw < 1180 ? 3 : 4;

  // ---- selected date: real calendar dates, business open Mon–Sat (closed Sundays) ----
  const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isClosed = (d) => d.getDay() === 0; // Sundays closed
  const firstOpenISO = React.useMemo(() => { const d = new Date(); while (isClosed(d)) d.setDate(d.getDate() + 1); return isoOf(d); }, []);
  const [date, setDate] = React.useState(firstOpenISO);
  const [addOpen, setAddOpen] = React.useState(false); // service-selector modal
  const [holdOpen, setHoldOpen] = React.useState(false); // temporary-hold info modal (pre-payment)
  const [termsOpen, setTermsOpen] = React.useState(false); // Términos del servicio modal
  const [cancelOpen, setCancelOpen] = React.useState(false); // Política de cancelación modal
  const [proPickerFor, setProPickerFor] = React.useState(null); // service index for the "Cambiar" selector
  const [query, setQuery] = React.useState('');

  // Rezervame requires online payment (Tarjeta / Yappy) to confirm a reservation.
  // The booking CTA always hands off to the Pago page; success is shown only after
  // the payment is approved there.
  const businessName = (initialReservation && initialReservation.business) || 'Luxe Hair Studio';
  // Cancellation / no-show policy — per-business configuration.
  // 'full' → 100% of the reservation total · 'partial' → 50%.
  const cancelPolicy = 'full';
  const cancelFeePct = cancelPolicy === 'partial' ? 50 : 100;

  // ---- professional eligibility: not every pro performs every service ----
  // Each pro covers a set of service categories; a service maps to one category.
  const PRO_CATS = {
    0: ['Barbería', 'Corte'],            // Mateo Ríos
    1: ['Color', 'Corte'],               // Diego Mendoza
    2: ['Color', 'Peinado', 'Maquillaje'], // Sofía Herrera
    3: ['Tratamiento', 'Color'],         // Camila Vega
    4: ['Barbería', 'Corte'],            // Lucas Moreno
    5: ['Color'],                        // Valentina Cruz
    6: ['Peinado', 'Corte'],             // Andrés Pinto
    7: ['Tratamiento'],                  // Isabella Ramos
  };
  const serviceCategory = (name) => {
    const n = (name || '').toLowerCase();
    if (/(barba|fade|afeitad|hombre)/.test(n)) return 'Barbería';
    if (/(uñas|manicur|pedicur)/.test(n)) return 'Uñas';
    if (/(maquillaje|cejas|pestañas)/.test(n)) return 'Maquillaje';
    if (/(colora|highlights|balayage|reflejos|tinte|mechas)/.test(n)) return 'Color';
    if (/(keratina|tratamiento|botox|hidrata)/.test(n)) return 'Tratamiento';
    if (/(peinado|secado|blower|recogido|ondas)/.test(n)) return 'Peinado';
    if (/corte/.test(n)) return 'Corte';
    return 'Corte';
  };
  const eligiblePros = (name) => {
    const cat = serviceCategory(name);
    return RZ.team.map((m, i) => i).filter((i) => PRO_CATS[i].includes(cat));
  };

  // If the user arrived from a service card, that service is pre-selected.
  const makeItem = (s) => {
    const elig = eligiblePros(s.name);
    // One eligible pro → assign automatically; several → default "any"; none → unassigned.
    const pro = elig.length === 1 ? elig[0] : elig.length ? 'any' : null;
    return { name: s.name, price: s.price, duration: s.duration, pro, time: '10:30 AM', forId: 'self' };
  };
  const proIndexByName = (name) => RZ.team.findIndex((m) => m && m.name === name);
  const findPersonIdByName = (name) => { const p = (RZ.account && RZ.account.people || []).find((x) => x.name === name); return p ? p.id : 'self'; };
  const [services, setServices] = React.useState(() => {
    if (initialReservation && initialReservation.services && initialReservation.services.length) {
      return initialReservation.services.map((s) => {
        const item = makeItem({ name: s.name, price: s.price, duration: `${s.duration} min` });
        const pi = s.pro ? proIndexByName(s.pro) : -1;
        return { ...item, pro: pi >= 0 ? pi : item.pro, forId: s.for ? findPersonIdByName(s.for) : 'self' };
      });
    }
    if (initialService && initialService.name) {
      const item = makeItem(initialService);
      if (initialProName) { const pi = proIndexByName(initialProName); if (pi >= 0 && eligiblePros(initialService.name).includes(pi)) item.pro = pi; }
      return [item];
    }
    const defs = [
      makeItem({ name: 'Corte de cabello para mujer', price: 65, duration: '60 min' }),
      { ...makeItem({ name: 'Highlights', price: 55, duration: '90 min' }), time: '12:00 PM' },
      { ...makeItem({ name: 'Maquillaje profesional', price: 70, duration: '60 min' }), time: '1:30 PM' },
    ];
    if (initialProName) {
      const pi = proIndexByName(initialProName);
      if (pi >= 0) return defs.map((s) => (eligiblePros(s.name).includes(pi) ? { ...s, pro: pi } : s));
    }
    return defs;
  });
  // Lock scroll while a modal (service selector or pro picker) is open.
  React.useEffect(() => {
    if (!addOpen && proPickerFor == null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [addOpen, proPickerFor]);
  const inCart = (name) => services.some((x) => x.name === name);
  const toggleService = (svc) => setServices((list) => (
    list.some((x) => x.name === svc.name)
      ? list.filter((x) => x.name !== svc.name)
      : [...list, makeItem(svc)]
  ));
  const removeService = (i) => setServices((list) => list.filter((_, idx) => idx !== i));
  const setServicePro = (i, pro) => setServices((list) => list.map((s, idx) => (idx === i ? { ...s, pro } : s)));
  const setServiceTime = (i, time) => setServices((list) => list.map((s, idx) => (idx === i ? { ...s, time } : s)));
  const proLabel = (pro) => (pro === 'any' ? 'Cualquier profesional' : pro == null ? 'Sin asignar' : RZ.team[pro].name);

  // ---- recipient: simple “Para mí” by default; group structure emerges only when 2+ recipients ----
  const [people, setPeople] = React.useState(() => (RZ.account && RZ.account.people ? RZ.account.people.slice() : []));
  const [groupPeople, setGroupPeople] = React.useState(() => {
    if (initialReservation && initialReservation.services) {
      let ids = [];
      initialReservation.services.forEach((s) => { const id = s.for ? findPersonIdByName(s.for) : 'self'; if (!ids.includes(id)) ids.push(id); });
      if (ids.includes('self')) ids = ['self', ...ids.filter((x) => x !== 'self')];
      return ids.length ? ids : ['self'];
    }
    return ['self'];
  });             // ordered recipient ids in this booking
  const [recipientPicker, setRecipientPicker] = React.useState({ open: false, mode: null, target: null }); // 'replace' | 'row' | 'addPerson'
  const [addTarget, setAddTarget] = React.useState('self');                   // forId the service selector adds to
  const grouped = groupPeople.length > 1;                                     // group view only once 2+ recipients
  const soloRecipient = groupPeople[0] || 'self';                             // the single recipient while not grouped
  const addPerson = (p) => setPeople((list) => (list.some((x) => x.id === p.id) ? list : [...list, p]));
  const personFor = (forId) => (!forId || forId === 'self' ? null : people.find((p) => p.id === forId) || null);
  const recipientName = (forId) => { const p = personFor(forId); return p ? p.name : 'Ti'; };
  const setAllFor = (forId) => setServices((list) => list.map((s) => ({ ...s, forId })));
  const setServiceFor = (i, forId) => setServices((list) => list.map((s, idx) => (idx === i ? { ...s, forId } : s)));
  const inCartFor = (name, forId) => services.some((s) => s.name === name && (s.forId || 'self') === forId);
  const toggleServiceFor = (svc, forId) => setServices((list) => {
    const idx = list.findIndex((s) => s.name === svc.name && (s.forId || 'self') === forId);
    if (idx >= 0) return list.filter((_, i) => i !== idx);
    return [...list, { ...makeItem(svc), forId }];
  });
  const openServicePicker = (forId) => { setAddTarget(forId); setAddOpen(true); };
  const removePerson = (forId) => {
    setGroupPeople((g) => { const next = g.filter((x) => x !== forId); return next.length ? next : ['self']; });
    setServices((list) => list.filter((s) => (s.forId || 'self') !== forId));
  };
  // The recipient picker resolves by how it was opened.
  const onPickRecipient = (forId) => {
    const { mode, target } = recipientPicker;
    if (mode === 'replace') { setGroupPeople([forId]); setAllFor(forId); }           // book everything for one recipient
    else if (mode === 'row') { setServiceFor(target, forId); setGroupPeople((g) => (g.includes(forId) ? g : [...g, forId])); } // change one row (may start a group)
    else if (mode === 'addPerson') { setGroupPeople((g) => (g.includes(forId) ? g : [...g, forId])); } // add another person block
  };
  const pickerValue = recipientPicker.mode === 'row'
    ? (services[recipientPicker.target] ? (services[recipientPicker.target].forId || 'self') : 'self')
    : soloRecipient;
  // Business' own catalogue, filtered by the modal search.
  const catalogue = (RZ.services || []).filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (s.name + ' ' + (s.description || '')).toLowerCase().includes(q);
  });

  // Real selected date → drives the month/year label, the per-date availability seed,
  // and the sequence/confirmation copy.
  const MONTHS_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const selDate = (() => { const [y, m, d] = date.split('-').map(Number); return new Date(y, m - 1, d); })();
  const dayNum = selDate.getDate();
  const dayLabel = `${dayNum} ${MONTHS_ABBR[selDate.getMonth()]} ${selDate.getFullYear()}`;
  // Time grid in minutes from midnight: 9:00 AM – 6:00 PM, 30-min steps.
  const GRID = [];
  for (let m = 540; m <= 1080; m += 30) GRID.push(m);
  const DAY_END = 1080; // 6:00 PM close
  const LUNCH = 750; // 12:30 PM — business closed (lunch)
  const toLabel = (min) => {
    const h = Math.floor(min / 60), m = min % 60, p = h >= 12 ? 'PM' : 'AM', hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:${m === 0 ? '00' : String(m).padStart(2, '0')} ${p}`;
  };
  const toMin = (label) => {
    const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(label || '');
    if (!m) return 600;
    let h = parseInt(m[1], 10) % 12; if (/pm/i.test(m[3])) h += 12;
    return h * 60 + parseInt(m[2], 10);
  };
  const durationMin = (d) => {
    const s = String(d || '').toLowerCase();
    const hr = s.match(/(\d+)\s*-?\s*\d*\s*hora/);
    if (hr) return parseInt(hr[1], 10) * 60;
    const mn = s.match(/(\d+)\s*min/);
    if (mn) return parseInt(mn[1], 10);
    return 60;
  };
  // Intrinsic blocked start-times for a professional (lunch + a few deterministic gaps).
  const proBlocked = (pro) => {
    const set = new Set([LUNCH]);
    if (pro === 'any' || pro == null) return set;
    GRID.forEach((m, idx) => { const seed = (Number(pro) + 1) * 5 + dayNum + idx * 2; if (seed % 6 === 0) set.add(m); });
    return set;
  };
  // Is a pro free for [start, start+dur) given existing bookings this reservation?
  const proFree = (pro, start, dur, booked) => {
    const blocked = proBlocked(pro);
    for (let ts = start; ts < start + dur; ts += 30) {
      if (ts >= DAY_END) return false;                               // past business hours
      if (blocked.has(ts)) return false;                             // lunch / pro gap
      if ((booked[pro] || []).some((b) => ts >= b.start && ts < b.end)) return false; // double-book
    }
    return true;
  };
  // Build the sequenced schedule: each service starts after the previous ends,
  // assigned to an eligible+available professional (resolving "any").
  // For each service we also surface `available` — the eligible pros who actually
  // have a valid slot at (or after) the calculated start given prior bookings —
  // so the professional selector can show only truly-available people.
  const buildSchedule = (list, firstStart) => {
    const booked = {};
    let cursor = firstStart;
    return list.map((s, i) => {
      const dur = durationMin(s.duration);
      const elig = eligiblePros(s.name);
      const from = i === 0 ? firstStart : cursor;

      // Earliest valid start (>= from) for each eligible pro, given prior bookings.
      const startsByPro = {};
      elig.forEach((p) => {
        for (let t = from; t < DAY_END; t += 30) {
          if (proFree(p, t, dur, booked)) { startsByPro[p] = t; break; }
        }
      });
      // Available = eligible pros with a real slot at/after the calculated time.
      const available = elig.filter((p) => startsByPro[p] != null)
        .sort((a, b) => startsByPro[a] - startsByPro[b]);
      const anyAvailable = available.length > 0;

      // Resolve the requested professional against real availability.
      let assigned = null, start = null, requestedUnavailable = false;
      if (anyAvailable) {
        if (s.pro === 'any') {
          assigned = available[0];                 // earliest available eligible pro
        } else if (available.includes(s.pro)) {
          assigned = s.pro;                         // requested pro is free → keep them
        } else {
          requestedUnavailable = true;              // requested a pro who isn't free now
        }
        if (assigned != null) start = startsByPro[assigned];
      }

      if (assigned == null) {
        // Either nobody can do it at this time (anyAvailable === false),
        // or the specifically-requested pro is unavailable (requestedUnavailable).
        return { unavailable: true, dur, elig, available, anyAvailable, requestedUnavailable, startsByPro, from };
      }
      booked[assigned] = [...(booked[assigned] || []), { start, end: start + dur }];
      const gap = i > 0 ? start - cursor : 0;
      cursor = start + dur;
      return { start, end: start + dur, pro: assigned, gap, dur, requested: s.pro, elig, available, anyAvailable, startsByPro, from };
    });
  };

  const [startMin, setStartMin] = React.useState(600); // first service start (10:00 AM)
  const schedule = buildSchedule(services, startMin);
  // Full reservation span (first start → last end, including any waiting gaps).
  const scheduled = schedule.filter((x) => !x.unavailable);
  const seqSpan = scheduled.length ? { start: Math.min(...scheduled.map((x) => x.start)), end: Math.max(...scheduled.map((x) => x.end)) } : null;
  const spanLabel = (mins) => { const h = Math.floor(mins / 60), m = mins % 60; return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`; };
  // Any service whose professional can't actually be staffed at the selected date/time
  // blocks confirmation (see point 7 of the availability spec).
  const hasUnavailable = schedule.some((x) => x.unavailable);

  // Start-time options for the FIRST service (depends on its duration + eligible pros).
  const first = services[0];
  const firstDur = first ? durationMin(first.duration) : 60;
  const firstElig = first ? eligiblePros(first.name) : [];
  const firstCand = first ? (first.pro === 'any' ? firstElig : (firstElig.includes(first.pro) ? [first.pro] : firstElig)) : [];
  // Cap start options at 3:00 PM so the rest of the sequence still fits the day.
  const firstSlots = GRID.filter((m) => m <= 900).map((m) => ({ time: toLabel(m), disabled: !firstCand.some((p) => proFree(p, m, firstDur, {})) }));

  // ---- subtle step indicator ----
  const steps = [
    { label: 'Servicios', done: services.length > 0 },
    { label: 'Fecha y hora', done: !!date && schedule.length > 0 && schedule.every((x) => !x.unavailable) },
    { label: 'Profesional', done: services.length > 0 && services.every((s) => s.pro != null) },
    { label: 'Pago y confirmación', done: false },
  ];
  const activeIndex = (() => { const i = steps.findIndex((s) => !s.done); return i === -1 ? steps.length - 1 : i; })();

  const total = services.reduce((t, s) => t + (Number(s.price) || 0), 0);
  const money = (n) => `$${n.toFixed(2)}`;
  // Build the order handed to the Pago page (online payments only).
  const buildOrder = () => {
    const first = schedule.find((x) => !x.unavailable);
    // Real start/end timestamps for calendar events (local date + minute offsets).
    const atMin = (mins) => { const d = new Date(selDate); d.setHours(0, mins, 0, 0); return d.toISOString(); };
    return {
      business: businessName,
      location: 'Av. Balboa, Ciudad de Panamá',
      dateLabel: dayLabel,
      datetime: first ? `${dayLabel} · ${toLabel(first.start)}` : dayLabel,
      startISO: seqSpan ? atMin(seqSpan.start) : null,
      endISO: seqSpan ? atMin(seqSpan.end) : null,
      reservationUrl: 'https://rezervame.app/mis-reservas',
      subtotal: total,
      professionals: [...new Set(services.map((s, i) => {
        const sc = schedule[i];
        return sc && !sc.unavailable ? RZ.team[sc.pro].name : null;
      }).filter(Boolean))],
      services: services.map((s, i) => {
        const sc = schedule[i];
        const ok = sc && !sc.unavailable;
        return {
          name: s.name,
          price: Number(s.price) || 0,
          pro: ok ? RZ.team[sc.pro].name : null,
          time: ok ? `${toLabel(sc.start)} – ${toLabel(sc.end)}` : null,
          for: personFor(s.forId) ? personFor(s.forId).name : null,
        };
      }),
    };
  };
  // The booking CTA opens the temporary-hold info modal first; the user proceeds to
  // the Pago page from there. Success (¡Reserva exitosa!) is shown only after the
  // online payment is approved on that page.
  const handleConfirm = () => {
    if (hasUnavailable) return;
    setHoldOpen(true);
  };
  const proceedToPayment = () => {
    setHoldOpen(false);
    onProceedToPayment(buildOrder());
  };
  const linkBtnStyle = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 'inherit', fontWeight: 600, color: 'var(--rz-coral)', textDecoration: 'underline', textUnderlineOffset: '2px' };
  const infoDotStyle = { flex: 'none', width: 16, height: 16, borderRadius: '50%', border: '1.5px solid var(--rz-coral)', background: 'transparent', color: 'var(--rz-coral)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 };
  const summary = (
    <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)', padding: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rz-coral)', marginBottom: 14 }}>Tu reserva</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {grouped ? (
          groupPeople.map((fid) => {
            const p = personFor(fid);
            const rows = services.map((s, i) => ({ s, i })).filter((x) => (x.s.forId || 'self') === fid);
            if (rows.length === 0) return null;
            return (
              <div key={fid} style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--rz-navy)', margin: '8px 0 2px' }}>
                  <Glyph name="user" size={13} style={{ color: 'var(--rz-coral)', flex: 'none' }} /> {fid === 'self' ? 'Para mí' : (p ? p.name : 'Invitado')}
                </div>
                {rows.map(({ s, i }) => {
                  const sc = schedule[i];
                  const meta = sc && !sc.unavailable ? `${RZ.team[sc.pro].name.split(' ')[0]} · ${toLabel(sc.start)}` : s.duration;
                  return (
                    <div key={s.name + i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '6px 0 6px 19px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--rz-navy)', lineHeight: 1.3 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--rz-gray-500)', marginTop: 2 }}>{meta}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rz-navy)', flex: 'none' }}>${s.price}</div>
                    </div>
                  );
                })}
              </div>
            );
          })
        ) : (
          <>
            {services.map((s, i) => (
              <div key={s.name + i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '8px 0' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-navy)', lineHeight: 1.3 }}>{s.name}</div>
                  {s.duration && <div style={{ fontSize: 12, color: 'var(--rz-gray-500)', marginTop: 2 }}>{s.duration}</div>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rz-navy)', flex: 'none' }}>${s.price}</div>
              </div>
            ))}
            <div style={{ marginTop: 6 }}><RecipientBadge prefix="Reserva para" name={recipientName(soloRecipient)} self={soloRecipient === 'self'} /></div>
          </>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '14px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--rz-navy)' }}>Total</span>
        <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--rz-coral)' }}>${total}</span>
      </div>
      {/* Cancellation fee — visible before continuing; full explanation in modal */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--rz-gray-600)' }}>
          Cargo por cancelación
          <button type="button" aria-label="Ver política de cancelación" onClick={() => setCancelOpen(true)} style={infoDotStyle}>?</button>
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--rz-navy)', flex: 'none' }}>Hasta {cancelFeePct}% del total</span>
      </div>
      {/* Online payment required — card or Yappy on the Pago page */}
      <div style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--rz-gray-050)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ flex: 'none', width: 34, height: 34, borderRadius: 9, background: '#fff', color: 'var(--rz-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}><Glyph name="lock" size={17} /></span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--rz-navy)' }}>Pago en línea</div>
            <div style={{ fontSize: 12, color: 'var(--rz-gray-500)', marginTop: 1 }}>Completa tu pago con tarjeta o Yappy para confirmar la reserva.</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Button variant="primary" fullWidth size="lg" disabled={hasUnavailable} onClick={handleConfirm}>Continuar</Button>
      </div>
      {!hasUnavailable && (
        <p style={{ fontSize: 12, color: 'var(--rz-gray-500)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
          Al continuar, aceptas los <button type="button" onClick={() => setTermsOpen(true)} style={linkBtnStyle}>Términos del servicio</button> y la{' '}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            <button type="button" onClick={() => setCancelOpen(true)} style={linkBtnStyle}>Política de cancelación</button>
            <button type="button" aria-label="Ver política de cancelación" onClick={() => setCancelOpen(true)} style={infoDotStyle}>?</button>
          </span>.
        </p>
      )}
      {hasUnavailable ? (
        <p style={{ fontSize: 12.5, color: 'var(--rz-warning)', display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 12, lineHeight: 1.5 }}>
          <Glyph name="helpCircle" size={15} style={{ flex: 'none', marginTop: 1 }} />
          Hay un servicio sin disponibilidad. Cambia la hora, fecha o profesional para continuar.
        </p>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--rz-gray-500)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>Cancela o reagenda sin costo hasta 60 minutos antes de tu cita.</p>
      )}
    </div>
  );

  return (
    <div style={{ background: 'var(--rz-gray-050)', minHeight: '100vh' }}>
      <Header logoSrc={logo} notifications user={RZ.user} onLogoClick={onHome} contextTitle="Reservar cita" contextSubtitle={businessName} {...RZ.loggedInHeaderProps({ onAccount, onFavorites, onLogout })} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: `28px clamp(20px, 4vw, 56px) 64px` }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: vw < 560 ? 4 : 10, marginBottom: 24, maxWidth: 720 }}>
          {steps.map((s, i) => {
            const active = i === activeIndex;
            const color = s.done ? 'var(--rz-coral)' : active ? 'var(--rz-coral)' : 'var(--rz-gray-300)';
            return (
              <React.Fragment key={s.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', flex: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    background: s.done ? 'var(--rz-coral)' : '#fff',
                    color: s.done ? '#fff' : color,
                    border: `1.5px solid ${color}`,
                  }}>
                    {s.done ? <Glyph name="check" size={14} /> : i + 1}
                  </span>
                  {(vw >= 640 || active) && (
                    <span style={{ fontSize: 13, fontWeight: active || s.done ? 600 : 500, color: s.done || active ? 'var(--rz-navy)' : 'var(--rz-gray-500)', whiteSpace: 'nowrap' }}>{s.label}</span>
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: 2, minWidth: 12, background: steps[i].done ? 'var(--rz-coral)' : 'var(--border-default)', borderRadius: 2 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {initialProName && proIndexByName(initialProName) >= 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: '12px 16px', background: 'var(--rz-coral-050)', border: '1px solid var(--rz-coral)', borderRadius: 'var(--radius-md)' }}>
            <Avatar src={RZ.img.staff[proIndexByName(initialProName)]} name={initialProName} size={38} />
            <div style={{ fontSize: 13.5, color: 'var(--rz-navy)', lineHeight: 1.4 }}>
              <strong>Profesional seleccionado: {initialProName}.</strong> Elige el servicio, la fecha y la hora para ver su disponibilidad.
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: twoCol ? 'minmax(0,1fr) 360px' : '1fr', gap: twoCol ? 32 : 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {grouped ? (
              <Panel title="Personas y servicios">
                <p style={{ fontSize: 13.5, color: 'var(--rz-gray-600)', marginTop: -6, marginBottom: 14 }}>
                  Organiza los servicios por persona. Agrega servicios a cada una o suma otra persona a la cita.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {groupPeople.map((fid) => {
                    const p = personFor(fid);
                    const rows = services.map((s, i) => ({ s, i })).filter((x) => (x.s.forId || 'self') === fid)
                      .map((x) => ({ name: x.s.name, meta: x.s.duration, price: x.s.price, onRemove: () => removeService(x.i), onChange: () => setRecipientPicker({ open: true, mode: 'row', target: x.i }) }));
                    return (
                      <PersonBookingGroup
                        key={fid}
                        self={fid === 'self'}
                        name={fid === 'self' ? 'Para mí' : (p ? p.name : 'Invitado')}
                        subtitle={p ? p.relationship : undefined}
                        services={rows}
                        onAddService={() => openServicePicker(fid)}
                        onRemovePerson={fid === 'self' ? undefined : () => removePerson(fid)}
                      />
                    );
                  })}
                </div>
                <button type="button" onClick={() => setRecipientPicker({ open: true, mode: 'addPerson', target: null })} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 14, padding: '13px 14px', background: 'transparent', border: '1.5px dashed var(--border-default)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--rz-coral)', transition: 'border-color var(--dur-base), background var(--dur-base)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--rz-coral)'; e.currentTarget.style.background = 'var(--rz-coral-050)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'transparent'; }}>
                  <Glyph name="plus" size={17} /> Agregar otra persona
                </button>
              </Panel>
            ) : (
              <Panel title="Servicios">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {services.map((s, i) => (
                    <div key={s.name + i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--rz-gray-050)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-navy)', lineHeight: 1.3 }}>{s.name}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', marginTop: 2 }}>{s.duration}</div>
                        {soloRecipient !== 'self' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                            <RecipientBadge name={recipientName(s.forId)} self={(s.forId || 'self') === 'self'} />
                            <button type="button" onClick={() => setRecipientPicker({ open: true, mode: 'row', target: i })} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--rz-coral)' }}>Cambiar</button>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rz-navy)', flex: 'none' }}>${s.price}</div>
                      <button aria-label={`Quitar ${s.name}`} onClick={() => removeService(i)} style={{ flex: 'none', width: 26, height: 26, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--rz-gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rz-coral)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--rz-gray-400)'; }}
                      ><Glyph name="close" size={16} /></button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginTop: 12 }}>
                  <button onClick={() => openServicePicker(soloRecipient)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--rz-coral)', padding: '4px 2px' }}>
                    <Glyph name="plusCircle" size={18} /> Agregar otro servicio
                  </button>
                  <button type="button" onClick={() => setRecipientPicker({ open: true, mode: 'replace', target: null })} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--rz-gray-600)', padding: '4px 2px' }}>
                    <Glyph name="users" size={15} style={{ color: 'var(--rz-coral)', flex: 'none' }} /> Reservar para otra persona
                  </button>
                </div>
              </Panel>
            )}

            <Panel title="Selecciona la fecha">
              <DateSelector value={date} onChange={setDate} minDate={firstOpenISO} isDateDisabled={(d) => d.getDay() === 0} />
            </Panel>

            <Panel title="Selecciona la hora">
              <p style={{ fontSize: 13.5, color: 'var(--rz-gray-600)', marginTop: -6, marginBottom: 16 }}>
                Elige la hora de inicio. Organizaremos los demás servicios según duración y disponibilidad.
              </p>

              {first && firstCand.length > 0 ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--rz-gray-700)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Glyph name="clock" size={15} style={{ color: 'var(--rz-coral)', flex: 'none' }} />
                    Hora de inicio · <span style={{ color: 'var(--rz-navy)' }}>{first.name}</span>
                  </div>
                  <TimeSlotSelector value={toLabel(startMin)} onChange={(t) => setStartMin(toMin(t))} columns={vw < 480 ? 3 : 5} slots={firstSlots} />
                </>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--rz-warning)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Glyph name="helpCircle" size={15} style={{ flex: 'none' }} /> No hay horarios disponibles para el primer servicio.
                </p>
              )}
            </Panel>

            <Panel title="Asigna un profesional por servicio">
              <p style={{ fontSize: 13.5, color: 'var(--rz-gray-600)', marginTop: -6, marginBottom: 16 }}>
                Cada servicio puede realizarlo un profesional distinto. Elige quién atiende cada uno.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {services.map((s, i) => {
                  const sc = schedule[i];
                  const avail = sc.available || [];
                  const noneAvailable = !sc.anyAvailable;          // nobody free at this time
                  const reqUnavail = sc.requestedUnavailable;      // chosen pro no longer free
                  const singleAvailable = !noneAvailable && !reqUnavail && avail.length === 1;
                  const assignedPro = sc.pro;                      // null while unavailable
                  const isAny = s.pro === 'any';
                  const warn = noneAvailable || reqUnavail;
                  const showChange = !noneAvailable && !singleAvailable; // pick / reassign
                  return (
                    <div key={s.name + i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      background: warn ? 'var(--rz-warning-bg)' : 'var(--rz-gray-050)',
                      border: `1px solid ${warn ? 'var(--rz-warning)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)',
                    }}>
                      {/* assigned professional avatar / icon */}
                      {warn ? (
                        <span style={{ flex: 'none', width: 38, height: 38, borderRadius: '50%', background: '#fff', color: 'var(--rz-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--rz-warning)' }}><Glyph name="helpCircle" size={19} /></span>
                      ) : isAny ? (
                        <span style={{ flex: 'none', width: 38, height: 38, borderRadius: '50%', background: 'var(--rz-coral-100)', color: 'var(--rz-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Glyph name="sparkles" size={19} /></span>
                      ) : (
                        <Avatar src={RZ.img.staff[assignedPro]} name={RZ.team[assignedPro].name} size={38} />
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-navy)', lineHeight: 1.3 }}>{s.name}</div>
                        {noneAvailable ? (
                          <>
                            <div style={{ fontSize: 12.5, color: 'var(--rz-warning)', fontWeight: 600, marginTop: 2 }}>Este servicio no tiene profesionales disponibles para la hora seleccionada.</div>
                            <div style={{ fontSize: 11.5, color: 'var(--rz-gray-600)', marginTop: 2 }}>Prueba elegir otra hora o una fecha diferente.</div>
                          </>
                        ) : reqUnavail ? (
                          <>
                            <div style={{ fontSize: 12.5, color: 'var(--rz-warning)', fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{RZ.team[s.pro].name} no está disponible a esta hora.</div>
                            <div style={{ fontSize: 11.5, color: 'var(--rz-gray-600)', marginTop: 2 }}>Elige otro profesional disponible para continuar.</div>
                          </>
                        ) : singleAvailable ? (
                          <>
                            <div style={{ fontSize: 12.5, color: 'var(--rz-navy)', fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{RZ.team[assignedPro].name}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--rz-gray-500)', marginTop: 1 }}>Única profesional disponible para este servicio</div>
                          </>
                        ) : isAny ? (
                          <>
                            <div style={{ fontSize: 12.5, color: 'var(--rz-gray-600)', marginTop: 2 }}>Cualquier profesional disponible</div>
                            <div style={{ fontSize: 11.5, color: 'var(--rz-gray-500)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Te atenderá {RZ.team[assignedPro].name.split(' ')[0]}</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 12.5, color: 'var(--rz-gray-600)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{RZ.team[assignedPro].name}</div>
                        )}
                      </div>

                      {showChange && (
                        <button onClick={() => setProPickerFor(i)} style={{
                          flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, height: 34, padding: '0 14px',
                          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          color: reqUnavail ? '#fff' : 'var(--rz-coral)',
                          background: reqUnavail ? 'var(--rz-coral)' : '#fff',
                          border: `1.5px solid ${reqUnavail ? 'var(--rz-coral)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-pill)',
                          transition: 'border-color var(--dur-base)',
                        }}
                          onMouseEnter={(e) => { if (!reqUnavail) e.currentTarget.style.borderColor = 'var(--rz-coral)'; }}
                          onMouseLeave={(e) => { if (!reqUnavail) e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                        >{reqUnavail ? 'Reasignar' : 'Cambiar'}</button>
                      )}
                      {singleAvailable && (
                        <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--rz-success)' }}>
                          <Glyph name="checkCircle" size={15} /> Asignado
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>

            {services.length > 1 && (
              <Panel title="Tu secuencia">
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: -6, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: 'var(--rz-gray-500)' }}>{dayLabel}</div>
                  {seqSpan && <div style={{ fontSize: 12, color: 'var(--rz-gray-500)' }}>{toLabel(seqSpan.start)} – {toLabel(seqSpan.end)}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {services.map((s, i) => {
                    const sc = schedule[i];
                    return (
                      <div key={s.name + i} style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                        {/* timeline rail */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none', width: 11 }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff', border: `2px solid ${sc.unavailable ? 'var(--rz-warning)' : 'var(--rz-coral)'}`, flex: 'none', marginTop: 14 }} />
                          {i < services.length - 1 && <span style={{ width: 2, flex: 1, background: 'var(--border-subtle)' }} />}
                        </div>
                        {/* compact row */}
                        <div style={{ flex: 1, minWidth: 0, padding: '11px 0', borderBottom: i < services.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--rz-navy)', minWidth: 0 }}>{s.name}</div>
                            {!sc.unavailable && (
                              <span style={{ flex: 'none', fontSize: 12.5, fontWeight: 600, color: 'var(--rz-navy)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{toLabel(sc.start)} – {toLabel(sc.end)}</span>
                            )}
                          </div>
                          {sc.unavailable ? (
                            <div style={{ fontSize: 12, color: 'var(--rz-warning)', marginTop: 3 }}>Sin disponibilidad para este servicio.</div>
                          ) : (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 12, color: 'var(--rz-gray-600)' }}>
                                <Glyph name="user" size={12} style={{ color: 'var(--rz-coral)', flex: 'none' }} />
                                <span>{RZ.team[sc.pro].name}</span>
                                <span style={{ color: 'var(--rz-gray-400)' }}>·</span>
                                <span>{s.duration}</span>
                              </div>
                              {sc.gap > 0 && (
                                <div style={{ fontSize: 11.5, color: 'var(--rz-gray-500)', marginTop: 4 }}>
                                  {RZ.team[sc.pro].name} tiene disponibilidad desde las {toLabel(sc.start)}.
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}
          </div>

          {/* Reservation summary — sticky on desktop, stacked on mobile */}
          <div style={twoCol ? { position: 'sticky', top: 24 } : undefined}>
            {summary}
          </div>
        </div>
      </div>

      {/* Internal service-selector modal — stays inside the booking flow */}
      {addOpen && (
        <div
          onClick={() => setAddOpen(false)}
          role="dialog" aria-modal="true" aria-label="Encuentra tu servicio"
          style={{
            position: 'fixed', inset: 0, zIndex: 120, background: 'var(--overlay-scrim)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: vw < 560 ? 'flex-end' : 'center', justifyContent: 'center',
            padding: vw < 560 ? 0 : 24, animation: 'rz-fade 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', maxWidth: vw < 560 ? '100%' : 560,
              maxHeight: vw < 560 ? '92vh' : '86vh', display: 'flex', flexDirection: 'column',
              background: 'var(--surface-card)',
              borderRadius: vw < 560 ? 'var(--radius-2xl) var(--radius-2xl) 0 0' : 'var(--radius-2xl)',
              boxShadow: 'var(--shadow-modal)', overflow: 'hidden',
              animation: vw < 560 ? 'rz-sheet 0.26s var(--ease-out)' : 'rz-pop 0.24s var(--ease-out)',
            }}
          >
            {/* Header */}
            <div style={{ flex: 'none', padding: '20px 22px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 19, color: 'var(--rz-navy)' }}>Encuentra tu servicio</h3>
                  <p style={{ fontSize: 13, color: 'var(--rz-gray-500)', marginTop: 3 }}>{personFor(addTarget) ? <>Agregando para <strong style={{ color: 'var(--rz-navy)', fontWeight: 700 }}>{personFor(addTarget).name}</strong></> : `Servicios de ${businessName}`}</p>
                </div>
                <button onClick={() => setAddOpen(false)} aria-label="Cerrar" style={{
                  flex: 'none', width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: 'var(--rz-gray-100)', color: 'var(--rz-gray-600)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background var(--dur-base)',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rz-gray-200)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--rz-gray-100)'; }}
                ><Glyph name="close" size={18} /></button>
              </div>
              <div style={{ marginTop: 14 }}>
                <Input icon="search" placeholder="Buscar servicio…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus={vw >= 560} />
              </div>
            </div>

            {/* Scrollable service list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px 8px' }}>
              {catalogue.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--rz-gray-500)', fontSize: 14, padding: '36px 0' }}>No encontramos servicios para “{query}”.</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {catalogue.map((s, i) => {
                  const added = inCartFor(s.name, addTarget);
                  return (
                    <div key={s.name} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
                      borderBottom: i < catalogue.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--rz-navy)' }}>{s.name}</div>
                        {s.description && <div style={{ fontSize: 13, color: 'var(--rz-gray-500)', marginTop: 3, lineHeight: 1.45 }}>{s.description}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 7 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: 'var(--rz-navy)' }}>${s.price}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--rz-gray-500)' }}>
                            <Glyph name="clock" size={13} style={{ color: 'var(--rz-gray-400)' }} />{s.duration}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => toggleServiceFor(s, addTarget)} aria-label={added ? `Quitar ${s.name}` : `Agregar ${s.name}`} style={{
                        flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px',
                        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        borderRadius: 'var(--radius-pill)', transition: 'all var(--dur-base)',
                        background: added ? 'var(--rz-coral-050)' : 'var(--rz-coral)',
                        color: added ? 'var(--rz-coral-700)' : '#fff',
                        border: added ? '1.5px solid var(--rz-coral)' : '1.5px solid var(--rz-coral)',
                      }}>
                        <Glyph name={added ? 'check' : 'plus'} size={15} />{added ? 'Agregado' : 'Agregar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer — running count + done */}
            <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 22px', borderTop: '1px solid var(--border-subtle)', background: 'var(--rz-gray-050)' }}>
              <span style={{ fontSize: 13, color: 'var(--rz-gray-600)' }}>
                {services.length} {services.length === 1 ? 'servicio' : 'servicios'} · <strong style={{ color: 'var(--rz-navy)' }}>${services.reduce((t, s) => t + (Number(s.price) || 0), 0)}</strong>
              </span>
              <button onClick={() => setAddOpen(false)} style={{
                height: 40, padding: '0 22px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
                background: 'var(--rz-navy)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
              }}>Listo</button>
            </div>
          </div>
          <style>{`@keyframes rz-fade{from{opacity:0}to{opacity:1}}@keyframes rz-pop{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:none}}@keyframes rz-sheet{from{transform:translateY(100%)}to{transform:none}}`}</style>
        </div>
      )}

      {/* Professional selector ("Cambiar") — compact, per-service */}
      {proPickerFor != null && services[proPickerFor] && (() => {
        const i = proPickerFor;
        const s = services[i];
        const sc = schedule[i];
        const avail = sc.available || [];                 // only pros free at the calculated time
        const startsByPro = sc.startsByPro || {};
        const calcStart = sc.from;                        // earliest valid start for this service
        const Option = ({ selected, onClick, children }) => (
          <button onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
            padding: '12px 14px', cursor: 'pointer', borderRadius: 'var(--radius-md)',
            background: selected ? 'var(--rz-coral-050)' : '#fff',
            border: `1.5px solid ${selected ? 'var(--rz-coral)' : 'var(--border-subtle)'}`,
            transition: 'all var(--dur-base)', marginBottom: 8,
          }}
            onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >{children}</button>
        );
        return (
          <div
            onClick={() => setProPickerFor(null)}
            role="dialog" aria-modal="true" aria-label="Elige profesional"
            style={{
              position: 'fixed', inset: 0, zIndex: 120, background: 'var(--overlay-scrim)', backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: vw < 560 ? 'flex-end' : 'center', justifyContent: 'center',
              padding: vw < 560 ? 0 : 24, animation: 'rz-fade 0.2s ease',
            }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{
              position: 'relative', width: '100%', maxWidth: vw < 560 ? '100%' : 460,
              maxHeight: vw < 560 ? '88vh' : '82vh', display: 'flex', flexDirection: 'column',
              background: 'var(--surface-card)',
              borderRadius: vw < 560 ? 'var(--radius-2xl) var(--radius-2xl) 0 0' : 'var(--radius-2xl)',
              boxShadow: 'var(--shadow-modal)', overflow: 'hidden',
              animation: vw < 560 ? 'rz-sheet 0.26s var(--ease-out)' : 'rz-pop 0.24s var(--ease-out)',
            }}>
              <div style={{ flex: 'none', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '20px 22px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <h3 style={{ fontSize: 18, color: 'var(--rz-navy)' }}>Elige profesional</h3>
                  <p style={{ fontSize: 13, color: 'var(--rz-gray-500)', marginTop: 3 }}>
                    Para {s.name}{calcStart != null && <> · disponibles desde las <span style={{ color: 'var(--rz-navy)', fontWeight: 600 }}>{toLabel(calcStart)}</span></>}
                  </p>
                </div>
                <button onClick={() => setProPickerFor(null)} aria-label="Cerrar" style={{
                  flex: 'none', width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: 'var(--rz-gray-100)', color: 'var(--rz-gray-600)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Glyph name="close" size={18} /></button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 18px' }}>
                {avail.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 8px' }}>
                    <span style={{ display: 'inline-flex', width: 46, height: 46, borderRadius: '50%', background: 'var(--rz-warning-bg)', color: 'var(--rz-warning)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Glyph name="helpCircle" size={24} /></span>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-navy)' }}>Este servicio no tiene profesionales disponibles para la hora seleccionada.</div>
                    <div style={{ fontSize: 12.5, color: 'var(--rz-gray-600)', marginTop: 5 }}>Prueba elegir otra hora o una fecha diferente.</div>
                  </div>
                ) : (
                <>
                {/* Any professional — only when at least one is actually available */}
                <Option selected={s.pro === 'any'} onClick={() => { setServicePro(i, 'any'); setProPickerFor(null); }}>
                  <span style={{ flex: 'none', width: 44, height: 44, borderRadius: '50%', background: 'var(--rz-coral-100)', color: 'var(--rz-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Glyph name="sparkles" size={22} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--rz-navy)' }}>Cualquier profesional disponible</span>
                    <span style={{ display: 'block', fontSize: 12.5, color: 'var(--rz-gray-500)', marginTop: 1 }}>Te asignamos el primer horario libre</span>
                  </span>
                  {s.pro === 'any' && <Glyph name="checkCircle" size={20} style={{ color: 'var(--rz-coral)', flex: 'none' }} />}
                </Option>

                {avail.map((pi) => {
                  const m = RZ.team[pi];
                  return (
                    <Option key={pi} selected={s.pro === pi} onClick={() => { setServicePro(i, pi); setProPickerFor(null); }}>
                      <Avatar src={RZ.img.staff[pi]} name={m.name} size={44} ring={s.pro === pi} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--rz-navy)' }}>{m.name}</span>
                          <Rating value={m.rating} layout="compact" size={12} />
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--rz-gray-500)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.role}
                          {startsByPro[pi] != null && <><span style={{ color: 'var(--rz-gray-300)' }}>·</span><span style={{ color: 'var(--rz-success)', fontWeight: 600 }}>Libre a las {toLabel(startsByPro[pi])}</span></>}
                        </span>
                      </span>
                      {s.pro === pi && <Glyph name="checkCircle" size={20} style={{ color: 'var(--rz-coral)', flex: 'none' }} />}
                    </Option>
                  );
                })}
                </>
                )}
              </div>
            </div>
            <style>{`@keyframes rz-fade{from{opacity:0}to{opacity:1}}@keyframes rz-pop{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:none}}@keyframes rz-sheet{from{transform:translateY(100%)}to{transform:none}}`}</style>
          </div>
        );
      })()}

      {/* Recipient picker — "¿Para quién?" selection (and inline add person). */}
      <RecipientPicker
        open={recipientPicker.open}
        onClose={() => setRecipientPicker((s) => ({ ...s, open: false }))}
        people={people}
        value={pickerValue}
        onChange={onPickRecipient}
        onAddPerson={addPerson}
        relationships={RZ.account ? RZ.account.RELATIONSHIPS : undefined}
        title={recipientPicker.mode === 'addPerson' ? 'Agregar otra persona' : recipientPicker.mode === 'row' ? 'Para este servicio' : 'Reservar para otra persona'}
        subtitle={recipientPicker.mode === 'addPerson' ? 'Suma a alguien más a esta reserva.' : 'Reserva para ti, un familiar o un amigo.'}
      />

      {/* Temporary-hold info modal — shown before navigating to the Pago page. */}
      <Modal open={holdOpen} onClose={() => setHoldOpen(false)} width={460}>
        <div style={{ padding: 'clamp(28px,5vw,36px) clamp(24px,5vw,32px) clamp(22px,4vw,28px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'var(--rz-coral-050)', color: 'var(--rz-coral)', marginBottom: 18 }}>
            <Glyph name="shield" size={26} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: '-0.3px' }}>Importante</h2>
          <p style={{ fontSize: 14.5, color: 'var(--rz-gray-600)', marginTop: 12, lineHeight: 1.6 }}>
            Para asegurar tu cita, Rezervame realizará una <strong style={{ color: 'var(--rz-navy)', fontWeight: 700 }}>retención temporal</strong> por el monto de la reserva en tu método de pago.
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--rz-gray-500)', marginTop: 12, lineHeight: 1.6 }}>
            El cobro final se realizará después de completar el servicio. Si cancelas dentro del plazo permitido o el comercio cancela la cita, la retención será liberada o el monto será devuelto según el método de pago utilizado.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <Button variant="primary" size="lg" fullWidth leftIcon="lock" onClick={proceedToPayment}>Aceptar y pagar</Button>
            <Button variant="outline" size="lg" fullWidth onClick={() => setHoldOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Política de cancelación — Booksy-style no-show / late-cancel modal. */}
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} width={460}>
        <div style={{ padding: 'clamp(28px,5vw,36px) clamp(24px,5vw,32px) clamp(22px,4vw,28px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'var(--rz-coral-050)', color: 'var(--rz-coral)', marginBottom: 18 }}>
            <Glyph name="calendar" size={26} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: '-0.3px' }}>Evita cargos por cancelación</h2>
          <p style={{ fontSize: 14.5, color: 'var(--rz-gray-600)', marginTop: 12, lineHeight: 1.6 }}>
            Si necesitas cancelar o reagendar tu cita, asegúrate de hacerlo hasta <strong style={{ color: 'var(--rz-navy)', fontWeight: 700 }}>60 minutos antes</strong> de la hora programada.
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--rz-gray-500)', marginTop: 12, lineHeight: 1.6 }}>
            Las cancelaciones tardías, no presentarse a la cita o llegar demasiado tarde pueden generar un cargo de cancelación según la política definida por el comercio.
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--rz-gray-500)', marginTop: 12, lineHeight: 1.6 }}>
            Rezervame realizará una retención temporal para asegurar tu reserva. No se realizará el cobro final al momento de reservar; el cargo solo se aplicará después de completar el servicio o si incumples la política de cancelación del comercio.
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginTop: 18, padding: '13px 15px', background: 'var(--rz-gray-050)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <Glyph name="helpCircle" size={18} style={{ color: 'var(--rz-coral)', flex: 'none', marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1.45 }}>Cargo por cancelación tardía o no presentación</div>
              <div style={{ fontSize: 12.5, color: 'var(--rz-gray-600)', marginTop: 2 }}>{cancelFeePct}% del total de la reserva.</div>
            </div>
          </div>
          <div style={{ marginTop: 22 }}>
            <Button variant="primary" size="lg" fullWidth onClick={() => setCancelOpen(false)}>Entendido</Button>
          </div>
        </div>
      </Modal>

      {/* Términos del servicio — brief in-flow modal. */}
      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} width={460}>
        <div style={{ padding: 'clamp(28px,5vw,36px) clamp(24px,5vw,32px) clamp(22px,4vw,28px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'var(--rz-coral-050)', color: 'var(--rz-coral)', marginBottom: 18 }}>
            <Glyph name="shield" size={26} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: '-0.3px' }}>Términos del servicio</h2>
          <p style={{ fontSize: 14.5, color: 'var(--rz-gray-600)', marginTop: 12, lineHeight: 1.6 }}>
            Al reservar a través de Rezervame confirmas la cita seleccionada con {businessName} y autorizas el procesamiento del pago para asegurarla.
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--rz-gray-500)', marginTop: 12, lineHeight: 1.6 }}>
            El servicio es prestado por el comercio, no por Rezervame. Aplican la política de cancelación del comercio y las normas de uso de la plataforma. Cualquier cambio en tu cita está sujeto a la disponibilidad del comercio.
          </p>
          <div style={{ marginTop: 22 }}>
            <Button variant="primary" size="lg" fullWidth onClick={() => setTermsOpen(false)}>Entendido</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
window.Booking = Booking;
