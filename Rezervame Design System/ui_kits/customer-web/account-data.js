/* Account dashboard data + helpers (Rezervame customer web).
   Reservation timestamps are computed relative to load time so the
   "60 minutes before" cancellation rule is always live in the demo. */
(() => {
  const now = Date.now();
  const MIN = 60 * 1000, H = 60 * MIN, D = 24 * H;
  const iso = (ms) => new Date(ms).toISOString();

  const dDate = new Intl.DateTimeFormat('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
  const dTime = new Intl.DateTimeFormat('es-PA', { hour: 'numeric', minute: '2-digit', hour12: true });
  const cap = (s) => s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
  const fmtDate = (ms) => cap(dDate.format(new Date(ms)).replace('.', ''));
  const fmtTime = (ms) => dTime.format(new Date(ms)).replace(/\s/g, ' ').replace('a. m.', 'AM').replace('p. m.', 'PM').toUpperCase();
  const fmtRange = (a, b) => `${fmtTime(a)} – ${fmtTime(b)}`;

  // Build one reservation. startOffsetMs is relative to now.
  const mk = (o) => {
    const start = now + o.offset;
    const dur = o.services.reduce((t, s) => t + s.duration, 0);
    const end = start + dur * MIN;
    const subtotal = o.services.reduce((t, s) => t + s.price, 0);
    const tip = o.tip || 0;
    return {
      id: o.id, business: o.business, img: o.img, address: o.address,
      services: o.services,
      startISO: iso(start), endISO: iso(end),
      dateLabel: fmtDate(start),
      timeRange: fmtRange(start, end),
      datetimeLabel: `${fmtDate(start)} · ${fmtRange(start, end)}`,
      durationLabel: dur >= 60 ? `${Math.floor(dur / 60)} h${dur % 60 ? ` ${dur % 60} min` : ''}` : `${dur} min`,
      status: o.status,
      subtotal, tip, total: subtotal + tip,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      cancelFeePct: o.cancelFeePct != null ? o.cancelFeePct : 100,
      reservationUrl: `https://rezervame.app/mis-reservas/${o.id.replace('#', '').toLowerCase()}`,
      _start: start, _end: end,
    };
  };

  const B = RZ.businesses;
  const reservations = [
    mk({ id: '#RES-2041', business: 'Luxe Hair Studio', img: RZ.img.salon, address: 'Av. Balboa, Ciudad de Panamá',
      offset: 2 * D + 3 * H, status: 'upcoming', paymentMethod: 'Visa terminada en 4242', paymentStatus: 'Retención temporal activa', cancelFeePct: 100,
      services: [
        { name: 'Corte de cabello para mujer', pro: 'Sofía Herrera', duration: 60, price: 65, for: 'Ana Pérez' },
        { name: 'Highlights', pro: 'Diego Mendoza', duration: 120, price: 140 },
      ] }),
    mk({ id: '#RES-2038', business: 'The Grooming Room', img: RZ.img.cats[5], address: 'San Francisco, Ciudad de Panamá',
      offset: 35 * MIN, status: 'confirmed', paymentMethod: 'Yappy', paymentStatus: 'Pago protegido por Rezervame', cancelFeePct: 50,
      services: [
        { name: 'Corte clásico', pro: 'Lucas Moreno', duration: 45, price: 20 },
        { name: 'Perfilado de barba', pro: 'Mateo Ríos', duration: 30, price: 15 },
      ] }),
    mk({ id: '#RES-2025', business: 'Studio Blush', img: RZ.img.cats[0], address: 'El Cangrejo, Ciudad de Panamá',
      offset: 5 * D + 2 * H, status: 'pending', paymentMethod: 'Sin método autorizado', paymentStatus: 'Pago no completado', cancelFeePct: 100,
      services: [{ name: 'Balayage', pro: 'Valentina Cruz', duration: 180, price: 180 }] }),
    mk({ id: '#RES-1994', business: 'Spa Wellness Center', img: RZ.img.cats[1], address: 'Punta Pacífica, Ciudad de Panamá',
      offset: -9 * D, status: 'completed', paymentMethod: 'Visa terminada en 4242', paymentStatus: 'Cobrado', tip: 10,
      services: [{ name: 'Masaje relajante 60 min', pro: 'Camila Vega', duration: 60, price: 90, for: 'Carlos Rivera' }] }),
    mk({ id: '#RES-1972', business: 'Glow Beauty Bar', img: RZ.img.cats[2], address: 'Marbella, Ciudad de Panamá',
      offset: -20 * D, status: 'cancelled', paymentMethod: 'Mastercard terminada en 5555', paymentStatus: 'Reembolsado',
      services: [{ name: 'Maquillaje profesional', pro: 'Andrés Pinto', duration: 60, price: 80 }] }),
    mk({ id: '#RES-1958', business: 'Nail Society Soho', img: RZ.img.cats[4], address: 'Costa del Este, Ciudad de Panamá',
      offset: -30 * D, status: 'noshow', paymentMethod: 'Visa terminada en 4242', paymentStatus: 'Cargo por no presentación', cancelFeePct: 50,
      services: [{ name: 'Manicure spa', pro: 'Isabella Ramos', duration: 45, price: 30 }] }),
  ];

  // Status presentation map.
  const STATUS = {
    upcoming: { label: 'Próxima', tone: 'info' },
    confirmed: { label: 'Confirmada', tone: 'coral' },
    completed: { label: 'Completada', tone: 'success' },
    cancelled: { label: 'Cancelada', tone: 'error' },
    pending: { label: 'Sin confirmar', tone: 'warning' },
    noshow: { label: 'No asistió', tone: 'neutral' },
  };
  const PAYSTATUS = {
    'Pago protegido por Rezervame': { tone: 'success', icon: 'shield' },
    'Retención temporal activa': { tone: 'info', icon: 'lock' },
    'Cobrado': { tone: 'success', icon: 'checkCircle' },
    'Reembolsado': { tone: 'neutral', icon: 'arrowLeft' },
    'Reserva cancelada': { tone: 'error', icon: 'close' },
    'Pago no completado': { tone: 'warning', icon: 'clock' },
    'Pago fallido': { tone: 'error', icon: 'helpCircle' },
    'Pago expirado': { tone: 'neutral', icon: 'clock' },
    'Cargo por no presentación': { tone: 'error', icon: 'helpCircle' },
  };

  // Minutes from now until the appointment; can modify only > 60 min before and
  // for not-yet-passed, active reservations.
  const minsUntil = (res) => Math.round((res._start - Date.now()) / MIN);
  const canModify = (res) => (res.status === 'upcoming' || res.status === 'confirmed') && minsUntil(res) > 60;
  const isUpcomingState = (res) => ['upcoming', 'confirmed', 'pending'].includes(res.status);
  // A reservation is only confirmed once payment was authorized (hold active /
  // protected). 'pending' = payment not completed → not a confirmed reservation.
  const isConfirmed = (res) => ['upcoming', 'confirmed'].includes(res.status);

  // ---- calendar links (Google / Outlook / iCal) ----
  const pad = (n) => String(n).padStart(2, '0');
  const toUTC = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const calendar = (res) => {
    const start = new Date(res.startISO), end = new Date(res.endISO);
    const title = `Reserva en ${res.business}`;
    const pros = [...new Set(res.services.map((s) => s.pro).filter(Boolean))];
    const lines = [
      `Servicios: ${res.services.map((s) => s.name).join(', ')}.`,
      pros.length ? `Profesionales: ${pros.join(', ')}.` : '',
      'Reserva realizada a través de Rezervame.',
      `Ver tu reserva: ${res.reservationUrl}`,
    ].filter(Boolean);
    const desc = lines.join('\n');
    const gStart = toUTC(start), gEnd = toUTC(end);
    const google = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + `&text=${encodeURIComponent(title)}&dates=${gStart}/${gEnd}`
      + `&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(res.address || '')}`;
    const outlook = 'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent'
      + `&subject=${encodeURIComponent(title)}&startdt=${encodeURIComponent(start.toISOString())}`
      + `&enddt=${encodeURIComponent(end.toISOString())}&body=${encodeURIComponent(desc)}&location=${encodeURIComponent(res.address || '')}`;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rezervame//Reserva//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:${gStart}-${res.id.replace('#', '')}@rezervame.app`, `DTSTAMP:${toUTC(new Date())}`,
      `DTSTART:${gStart}`, `DTEND:${gEnd}`, `SUMMARY:${title}`, `DESCRIPTION:${desc.replace(/\n/g, '\\n')}`,
      res.address ? `LOCATION:${res.address}` : '', `URL:${res.reservationUrl}`, 'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');
    return { title, google, outlook, ics };
  };
  const downloadICS = (res) => {
    const { ics } = calendar(res);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reserva-${res.id.replace('#', '').toLowerCase()}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ---- invoices ----
  const invoices = [
    { id: '#FAC-2041', business: 'Luxe Hair Studio', date: '15 Jun 2026', amount: 205.00, method: 'Visa •• 4242', status: 'paid' },
    { id: '#FAC-1994', business: 'Spa Wellness Center', date: '18 May 2026', amount: 100.00, method: 'Visa •• 4242', status: 'paid' },
    { id: '#FAC-1972', business: 'Glow Beauty Bar', date: '07 May 2026', amount: 80.00, method: 'Mastercard •• 5555', status: 'refunded' },
    { id: '#FAC-1958', business: 'Nail Society Soho', date: '28 Abr 2026', amount: 15.00, method: 'Visa •• 4242', status: 'pending' },
    { id: '#FAC-1903', business: 'The Grooming Room', date: '02 Abr 2026', amount: 35.00, method: 'Yappy', status: 'paid' },
  ];

  // ---- favorites (indices into RZ.businesses) ----
  const favorites = [0, 5, 3, 6];

  // ---- notifications (notification center + header dropdown preview) ----
  // category: reservas | pagos | resenas | favoritos
  // action:   reservation | review | business | payment  (drives navigation)
  const notifications = [
    { id: 'n1', icon: 'calendar', category: 'reservas', action: 'reservation',
      title: 'Tu cita en Luxe Hair Studio es mañana a las 10:30 AM.',
      message: 'Corte y highlights con Sofía Herrera. Llega 10 minutos antes.',
      time: 'Hace 2 h', date: '27 Jun 2026 · 9:14 AM', unread: true, actionLabel: 'Ver reserva' },
    { id: 'n2', icon: 'checkCircle', category: 'reservas', action: 'reservation',
      title: 'Tu reserva en The Grooming Room fue confirmada.',
      message: 'Corte clásico y perfilado de barba. El pago quedó protegido por Rezervame.',
      time: 'Hace 5 h', date: '27 Jun 2026 · 6:02 AM', unread: true, actionLabel: 'Ver reserva' },
    { id: 'n3', icon: 'lock', category: 'pagos', action: 'payment',
      title: 'Activamos una retención temporal de $205.00 en tu Visa •• 4242.',
      message: 'Es solo una autorización. El cobro final se hará al completar tu cita.',
      time: 'Hace 8 h', date: '27 Jun 2026 · 3:20 AM', unread: true, actionLabel: 'Ver detalle' },
    { id: 'n4', icon: 'star', category: 'resenas', action: 'review', reservationId: '#RES-1994',
      title: '¿Cómo estuvo tu visita a Spa Wellness Center?',
      message: 'Tu opinión ayuda a otros clientes. Deja una reseña en menos de un minuto.',
      time: 'Ayer', date: '26 Jun 2026 · 5:45 PM', unread: true, actionLabel: 'Dejar reseña' },
    { id: 'n5', icon: 'heart', category: 'favoritos', action: 'business',
      title: 'Studio Blush, uno de tus favoritos, abrió nuevos horarios.',
      message: 'Ahora con citas los domingos. Reserva antes de que se llenen.',
      time: 'Hace 2 días', date: '25 Jun 2026 · 11:30 AM', unread: false, actionLabel: 'Ver negocio' },
    { id: 'n6', icon: 'arrowLeft', category: 'pagos', action: 'payment',
      title: 'Tu retención de $80.00 en Glow Beauty Bar fue liberada.',
      message: 'El monto retenido volvió a estar disponible en tu Mastercard •• 5555.',
      time: 'Hace 4 días', date: '23 Jun 2026 · 2:10 PM', unread: false, actionLabel: 'Ver detalle' },
    { id: 'n7', icon: 'close', category: 'reservas', action: 'reservation',
      title: 'Tu reserva en Glow Beauty Bar fue cancelada.',
      message: 'Procesamos el reembolso completo. Puede tardar de 3 a 5 días hábiles.',
      time: 'Hace 6 días', date: '21 Jun 2026 · 9:00 AM', unread: false, actionLabel: 'Ver reserva' },
    { id: 'n8', icon: 'sparkles', category: 'favoritos', action: 'business',
      title: 'Nail Society Soho lanzó una promoción de temporada.',
      message: '20% de descuento en manicure spa durante toda esta semana.',
      time: 'Hace 1 semana', date: '20 Jun 2026 · 10:15 AM', unread: false, actionLabel: 'Ver negocio' },
  ];

  // ---- saved cards ----
  const cards = [
    { id: 'c1', brand: 'visa', last4: '4242', exp: '08/27', holder: 'Richard Lucas', default: true },
    { id: 'c2', brand: 'mastercard', last4: '5555', exp: '11/26', holder: 'Richard Lucas', default: false },
  ];

  // ---- familia y amigos (people you can book for) ----
  const RELATIONSHIPS = ['Mamá', 'Papá', 'Esposo/a', 'Hijo/a', 'Hermano/a', 'Amigo/a', 'Otro'];
  const people = [
    { id: 'p1', name: 'Ana Pérez', relationship: 'Hija', phone: '+507 6000-0001', email: '', notes: '' },
    { id: 'p2', name: 'Laura Gómez', relationship: 'Amiga', phone: '+507 6000-0002', email: '', notes: '' },
    { id: 'p3', name: 'Carlos Rivera', relationship: 'Esposo', phone: '+507 6000-0003', email: '', notes: '' },
  ];

  RZ.account = {
    user: { ...RZ.user, phone: '+507 6000-0000', email: 'richard@correo.com' },
    reservations, invoices, favorites, cards, notifications, people, RELATIONSHIPS,
    STATUS, PAYSTATUS,
    minsUntil, canModify, isUpcomingState, isConfirmed, calendar, downloadICS,
  };
})();
