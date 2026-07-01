/* Venue / business profile page — Luxe Hair Studio. */

/* Real interactive mini-map (Leaflet, clean light tiles) for the info card.
   Structured so the coords can later come from a real business record. */
function VenueMiniMap({ lat, lng, label }) {
  const ref = React.useRef(null);
  const mapRef = React.useRef(null);
  React.useEffect(() => {
    const L = window.L;
    if (!L || !ref.current || mapRef.current) return;
    const map = L.map(ref.current, {
      center: [lat, lng], zoom: 15, zoomControl: true,
      attributionControl: false, scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' }).addTo(map);
    const pin = L.divIcon({
      className: '',
      html: '<div style="filter:drop-shadow(0 3px 4px rgba(2,48,71,0.3))"><svg width="30" height="40" viewBox="0 0 24 32"><path style="fill:var(--rz-coral)" d="M12 0C5.37 0 0 5.37 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.37 18.63 0 12 0z"/><circle cx="12" cy="12" r="4.6" fill="#fff"/></svg></div>',
      iconSize: [30, 40], iconAnchor: [15, 38],
    });
    L.marker([lat, lng], { icon: pin }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 120);
    return () => { map.remove(); mapRef.current = null; };
  }, [lat, lng]);
  // `isolation: isolate` makes this its own stacking context so Leaflet's
  // internal panes/controls (z-index up to 1000) stay contained here and can
  // never paint above the portfolio lightbox modal.
  return <div ref={ref} style={{ position: 'absolute', inset: 0, isolation: 'isolate' }} aria-label={label} />;
}

function VenuePage({ onReserve, onHome, onAccount, onFavorites, onLogout, isLoggedIn, favorites = {}, onToggleFav }) {
  const DS = window.RezervameDesignSystem_4317c4;
  const { Header, Footer, Tabs, Chip, Badge, Rating, Button, IconButton, ServiceCard, StaffCard, BusinessInfoPanel, CategoryCard, PortfolioGallery, Glyph, StickyBookingBar, Modal, Avatar, Select } = DS;
  const RZ = window.RZ;

  // Luxe Hair Studio is business index 0 — favorites are shared app state, so the
  // heart here stays in sync with Search Results / Account and is auth-gated.
  const VENUE_IDX = 0;
  const BUSINESS_URL = 'https://rezervame.com/negocio/luxe-hair-studio';
  // Business location — coords drive the map marker; address is the Google Maps query.
  const VENUE_COORDS = { lat: 8.9824, lng: -79.5238 };
  const VENUE_ADDRESS = 'Luxe Hair Studio, Avenida Balboa, Calle Uruguay 405, Ciudad de Panamá';
  const openDirections = () => {
    // Open Google Maps for the business (coords available; address query is the most
    // reliable way to land on the right place by name).
    window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(VENUE_ADDRESS), '_blank');
  };

  const [tab, setTab] = React.useState('servicios');
  const [filter, setFilter] = React.useState('TODOS');
  const [servicesExpanded, setServicesExpanded] = React.useState(false);
  const [teamExpanded, setTeamExpanded] = React.useState(false);
  const [pfilter, setPfilter] = React.useState('Todos');
  const [lightbox, setLightbox] = React.useState(null);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const [infoModal, setInfoModal] = React.useState(null);
  const [reviewFilter, setReviewFilter] = React.useState('todas');
  const [reviewsExpanded, setReviewsExpanded] = React.useState(false);
  const [starMenuOpen, setStarMenuOpen] = React.useState(false);
  const titleRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const lbTouch = React.useRef(0);
  const toastTimer = React.useRef(null);
  const logo = '../../assets/logos/rezervame-color.png';
  const logoW = '../../assets/logos/rezervame-white.png';

  // ---- responsive ----
  const [vw, setVw] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  React.useEffect(() => {
    const o = () => setVw(window.innerWidth);
    window.addEventListener('resize', o, { passive: true });
    return () => window.removeEventListener('resize', o);
  }, []);
  const stack = vw < 1000;
  const thumbCols = vw < 640 ? 3 : 6;
  const teamCols = vw < 560 ? 1 : vw < 880 ? 2 : vw < 1180 ? 3 : 4;
  const PAD = 'clamp(24px, 3vw, 44px)';
  const MAXW = 1760;

  // ---- favorites (auth-gated by the app) ----
  const isFav = !!favorites[VENUE_IDX];

  // ---- share ----
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  };
  const onShare = () => {
    // Touch devices (mobile/tablet) → native share sheet when available.
    // Desktop / no native support → compact fallback menu.
    const isTouch = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (navigator.share && isTouch) {
      navigator.share({ title: 'Luxe Hair Studio', text: 'Reserva en Luxe Hair Studio en Rezervame', url: BUSINESS_URL }).catch(() => {});
    } else {
      setShareOpen((o) => !o);
    }
  };
  const copyLink = () => {
    const done = () => { showToast('Enlace copiado'); setShareOpen(false); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(BUSINESS_URL).then(done).catch(done);
      else done();
    } catch (e) { done(); }
  };

  // ---- "Ver todas las fotos" → open Portfolio tab + scroll to it (same page) ----
  // Manual timer-eased smooth scroll (independent of CSS scroll-behavior / rAF throttling).
  const smoothScrollTo = (top) => {
    const start = window.scrollY;
    const dist = top - start;
    if (Math.abs(dist) < 4) return;
    const dur = 460, t0 = Date.now();
    const ease = (p) => 1 - Math.pow(1 - p, 3);
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      window.scrollTo(0, start + dist * ease(p));
      if (p >= 1) clearInterval(id);
    }, 16);
  };
  const goToPortfolio = () => {
    setTab('portfolio');
    setTimeout(() => {
      const el = contentRef.current;
      if (el) smoothScrollTo(el.getBoundingClientRect().top + window.scrollY - 90);
    }, 60);
  };

  // ---- Portfolio gallery + lightbox ----
  const PF = RZ.portfolio || [];
  const portfolioImages = pfilter === 'Todos' ? PF : PF.filter((p) => p.cat === pfilter);
  // When the active filter changes, any open lightbox indexes into a different
  // list — close it to avoid pointing at the wrong image.
  React.useEffect(() => { setLightbox(null); }, [pfilter]);
  const lbCount = portfolioImages.length;
  const lbPrev = React.useCallback(() => setLightbox((i) => (i == null ? i : (i - 1 + lbCount) % lbCount)), [lbCount]);
  const lbNext = React.useCallback(() => setLightbox((i) => (i == null ? i : (i + 1) % lbCount)), [lbCount]);
  React.useEffect(() => {
    if (lightbox == null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      else if (e.key === 'ArrowLeft') lbPrev();
      else if (e.key === 'ArrowRight') lbNext();
    };
    window.addEventListener('keydown', onKey);
    // lock body scroll while the viewer is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [lightbox, lbPrev, lbNext]);

  // ---- dynamic service filters (only show categories that have services) ----
  const ALL_FILTERS = [
    { key: 'TODOS', test: () => true },
    { key: 'MUJERES', test: (s) => (s.audience || []).includes('mujeres') },
    { key: 'HOMBRES', test: (s) => (s.audience || []).includes('hombres') },
    { key: 'NIÑOS', test: (s) => (s.audience || []).includes('ninos') },
    { key: 'PROMOCIONES', test: (s) => !!s.promo },
  ];
  // Show all five filter buttons for review — Todos · Mujeres · Hombres · Niños · Promociones.
  const availableFilters = ALL_FILTERS;
  const activeF = availableFilters.find((f) => f.key === filter) || availableFilters[0];
  const visibleServices = RZ.services.filter(activeF.test);
  // Show a limited set by default; "Ver más" reveals the rest of the FILTERED list.
  const SERVICES_LIMIT = 4;
  const shownServices = servicesExpanded ? visibleServices : visibleServices.slice(0, SERVICES_LIMIT);
  const selectFilter = (key) => { setFilter(key); setServicesExpanded(false); };

  // ---- footer-link placeholder content (prototype routes) ----
  const LINK_CONTENT = [
    { title: 'Política de pago y cancelación', body: 'Aceptamos pagos con tarjeta y en el local. Puedes cancelar o reprogramar tu cita sin costo hasta 24 horas antes. Las cancelaciones tardías o inasistencias pueden generar un cargo equivalente al 50% del servicio reservado.' },
    { title: 'Reportar negocio', body: '¿Encontraste información incorrecta o tuviste una mala experiencia? Cuéntanos qué ocurrió y nuestro equipo de confianza revisará el reporte en un plazo de 48 horas. Tu reporte es confidencial.' },
  ];

  const WEEK_HOURS = [
    { day: 'Lunes', hours: '9:00 AM – 8:00 PM' },
    { day: 'Martes', hours: '9:00 AM – 8:00 PM' },
    { day: 'Miércoles', hours: '9:00 AM – 8:00 PM' },
    { day: 'Jueves', hours: '9:00 AM – 8:00 PM' },
    { day: 'Viernes', hours: '9:00 AM – 9:00 PM' },
    { day: 'Sábado', hours: '8:00 AM – 6:00 PM' },
    { day: 'Domingo', hours: 'Cerrado' },
  ];

  // Round translucent nav button used on either side of the lightbox image.
  const lbArrow = (w) => ({
    flex: 'none', width: w < 600 ? 44 : 52, height: w < 600 ? 44 : 52, borderRadius: '50%',
    border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background var(--dur-fast)',
  });

  const SectionHead = ({ title, sub }) => (
    <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 28px' }}>
      <h2 style={{ fontSize: 30 }}>{title}</h2>
      {sub && <p style={{ fontSize: 15, color: 'var(--rz-gray-500)', marginTop: 10, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );

  // ---- Reviews (Reseñas) data ----
  const REVIEW_SUMMARY = { avg: 4.9, total: 287, dist: { 5: 262, 4: 18, 3: 4, 2: 2, 1: 1 } };
  const REVIEWS = [
    { id: 'r1', name: 'María González', photo: RZ.img.staff[3], rating: 5, daysAgo: 14, date: 'Hace 2 semanas', service: 'Corte de cabello',
      comment: 'Excelente atención, el lugar muy limpio y el resultado me encantó. Sin duda volveré.',
      response: '¡Gracias María! Nos alegra muchísimo que disfrutaras tu visita. Te esperamos pronto.' },
    { id: 'r2', name: 'Valentina Cruz', photo: RZ.img.staff[2], rating: 5, daysAgo: 3, date: 'Hace 3 días', service: 'Corte y peinado',
      comment: 'El mejor salón al que he ido en la ciudad. Entendieron exactamente lo que quería y el ambiente es muy acogedor.',
      response: '¡Mil gracias, Valentina! Tu confianza significa todo para nosotras. 💛' },
    { id: 'r3', name: 'Carlos Mendoza', photo: RZ.img.staff[6], rating: 5, daysAgo: 21, date: 'Hace 3 semanas', service: 'Barba y fade',
      comment: 'Un trabajo impecable con la barba y el fade. Profesionales de primera y muy puntuales con la cita.' },
    { id: 'r4', name: 'Ana Lucía Ramírez', photo: null, rating: 5, daysAgo: 30, date: 'Hace 1 mes', service: 'Balayage',
      comment: 'Me hicieron un balayage espectacular, justo el tono que buscaba. Cuidan mucho el detalle y la salud del cabello.',
      response: 'Gracias Ana Lucía, fue un placer trabajar tu color. ¡Nos vemos en el retoque!' },
    { id: 'r5', name: 'Sofía Herrera', photo: RZ.img.staff[4], rating: 4, daysAgo: 30, date: 'Hace 1 mes', service: 'Manicure',
      comment: 'Muy buen servicio y resultado prolijo. Tuve que esperar unos minutos extra, pero valió la pena.' },
    { id: 'r6', name: 'Isabella Torres', photo: null, rating: 5, daysAgo: 7, date: 'Hace 1 semana', service: 'Highlights',
      comment: 'Quedé fascinada con mis highlights. El equipo es súper amable y te asesoran con honestidad.' },
    { id: 'r7', name: 'Diego Fernández', photo: null, rating: 4, daysAgo: 60, date: 'Hace 2 meses', service: 'Coloración',
      comment: 'Buen resultado de color y trato cordial. Repetiría sin problema.' },
    { id: 'r8', name: 'Roberto Díaz', photo: RZ.img.staff[0], rating: 5, daysAgo: 5, date: 'Hace 5 días', service: 'Corte de cabello',
      comment: '' },
  ];
  const filteredReviews = React.useMemo(() => {
    let list = REVIEWS.slice();
    if (['5', '4', '3', '2', '1'].includes(reviewFilter)) list = list.filter((r) => Math.floor(r.rating) === Number(reviewFilter));
    else if (reviewFilter === 'comentario') list = list.filter((r) => r.comment && r.comment.trim());
    else if (reviewFilter === 'recientes') list = list.sort((a, b) => a.daysAgo - b.daysAgo);
    return list;
  }, [reviewFilter]);
  React.useEffect(() => { setReviewsExpanded(false); }, [reviewFilter]);
  React.useEffect(() => {
    if (!starMenuOpen) return;
    const onDoc = (e) => { if (!e.target.closest || !e.target.closest('[data-star-filter]')) setStarMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [starMenuOpen]);
  const REVIEWS_LIMIT = 4;
  const shownReviews = reviewsExpanded ? filteredReviews : filteredReviews.slice(0, REVIEWS_LIMIT);

  return (
    <div style={{ background: 'var(--surface-card)' }}>
      <Header logoSrc={logo} notifications user={RZ.user} onLogoClick={onHome} contextTitle="Luxe Hair Studio" contextSubtitle="Categoría: Servicios para el cabello" {...RZ.loggedInHeaderProps({ onAccount, onFavorites, onLogout })} />

      <StickyBookingBar
        name="Luxe Hair Studio"
        location="Avenida Balboa, Ciudad de Panamá"
        avatar={RZ.img.salon}
        watchRef={titleRef}
        onReserve={onReserve}
      />

      {/* Widescreen container — uses available width with safe side padding,
         responsive across desktop / laptop / tablet / mobile (not a narrow column). */}
      <div style={{ maxWidth: MAXW, margin: '0 auto', padding: `28px ${PAD} 0` }}>
        {/* Gallery */}
        <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: 'clamp(230px, 36vw, 440px)' }}>
          <img src={RZ.img.salon} alt="Luxe Hair Studio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', right: 18, bottom: 18 }}>
            <Button variant="dark" size="sm" leftIcon="grid" style={{ background: 'rgba(2,30,44,0.78)', backdropFilter: 'blur(6px)' }} onClick={goToPortfolio}>Ver todas las fotos</Button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${thumbCols},1fr)`, gap: 12, marginTop: 12 }}>
          {RZ.img.hair.slice(0, thumbCols).map((h, i) => (
            <div key={i} style={{ height: vw < 640 ? 96 : 120, borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer' }} onClick={goToPortfolio}>
              <img src={h} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>

        {/* Title + content / sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: stack ? '1fr' : 'minmax(0,1fr) clamp(340px, 24vw, 400px)', gap: stack ? 28 : 'clamp(32px, 2.6vw, 48px)', marginTop: 36, alignItems: 'start' }}>
          <div>
            <div ref={titleRef} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)' }}>Luxe Hair Studio</h1>
                <div style={{ marginTop: 10 }}><Rating value={4.9} count={287} /></div>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--rz-gray-500)', marginTop: 10 }}>
                  <Glyph name="mapPin" size={15} /> Avenida Balboa, Ciudad de Panamá
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Badge tone="coral" uppercase={false}>Nuevo en la plataforma</Badge>
                <IconButton
                  variant="outlineNeutral" round
                  label={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                  icon={<Glyph name="heart" size={20} filled={isFav} style={{ color: isFav ? 'var(--rz-coral)' : undefined }} />}
                  onClick={() => onToggleFav && onToggleFav(VENUE_IDX)}
                />
                <div style={{ position: 'relative' }}>
                  <IconButton icon="share" variant="outlineNeutral" round label="Compartir" onClick={onShare} />
                  {shareOpen && (
                    <React.Fragment>
                      <div onClick={() => setShareOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
                      <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 61, width: 232, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: 6 }}>
                        {[{ ic: 'share', label: 'Copiar enlace', on: copyLink }].map((it) => (
                          <button key={it.label} onClick={it.on} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '10px 11px', border: 'none', background: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--rz-gray-700)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rz-gray-100)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                            <Glyph name={it.ic} size={17} style={{ color: 'var(--rz-coral)', flex: 'none' }} />{it.label}
                          </button>
                        ))}
                      </div>
                    </React.Fragment>
                  )}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 15, color: 'var(--rz-gray-700)', lineHeight: 1.6, marginTop: 18, maxWidth: 680 }}>
              Nuestro salón de belleza combina diseño moderno, productos de alta gama y un equipo de estilistas expertos dedicados a resaltar tu estilo y personalidad.
            </p>

            <div ref={contentRef} style={{ scrollMarginTop: 90 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30, marginBottom: 36 }}>
                <Tabs value={tab} onChange={(v) => {
                  setTab(v);
                  if (v === 'portfolio') {
                    setTimeout(() => { const el = contentRef.current; if (el) smoothScrollTo(el.getBoundingClientRect().top + window.scrollY - 90); }, 60);
                  }
                }} items={[
                  { label: 'Servicios', value: 'servicios' }, { label: 'Equipo', value: 'equipo' },
                  { label: 'Portfolio', value: 'portfolio' }, { label: 'Reseñas', value: 'resenas' }, { label: 'Amenidades', value: 'amenidades' },
                ]} />
              </div>

              {tab === 'servicios' && (
                <div>
                  <SectionHead title="Nuestros Servicios" sub="Desde cortes de precisión hasta servicios de color transformadores, nuestro equipo ofrece resultados excepcionales." />
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
                    {availableFilters.map((f) => (
                      <Chip key={f.key} active={activeF.key === f.key} onClick={() => selectFilter(f.key)} style={{ padding: '0 24px' }}>{f.key}</Chip>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {shownServices.map((s) => (
                      <div key={s.name} className="rz-svc-hover">
                        <ServiceCard {...s} selected={false} style={{ transition: 'border-color var(--dur-base)' }}
                          onAction={() => onReserve(s)} />
                      </div>
                    ))}
                  </div>
                  {visibleServices.length > SERVICES_LIMIT && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
                      <Button variant="outline" onClick={() => setServicesExpanded((e) => !e)}
                        rightIcon={<Glyph name="chevronDown" size={16} style={{ transform: servicesExpanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-base)' }} />}>
                        {servicesExpanded ? 'Ver menos' : `Ver más (${visibleServices.length - SERVICES_LIMIT})`}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {tab === 'equipo' && (
                <div>
                  <SectionHead title="Equipo" sub="Conoce a los profesionales detrás de cada servicio, expertos apasionados que combinan técnica, creatividad y dedicación." />
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${teamCols},1fr)`, gap: 16 }}>
                    {(teamExpanded ? RZ.team : RZ.team.slice(0, teamCols)).map((m, i) => (
                      <StaffCard key={i} compact photo={RZ.img.staff[i]} {...m} stats={m.stats.slice(0, 4)} onAction={() => onReserve({ proName: m.name })} />
                    ))}
                  </div>
                  {RZ.team.length > teamCols && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                      <Button variant="outline" onClick={() => setTeamExpanded((e) => !e)}
                        rightIcon={<Glyph name="chevronDown" size={16} style={{ transform: teamExpanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-base)' }} />}>
                        {teamExpanded ? 'Ver menos' : `Ver más (${RZ.team.length - teamCols})`}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {tab === 'portfolio' && (
                <div>
                  <SectionHead title="Portfolio" sub="Explora una galería de trabajos reales realizados por el negocio." />
                  <PortfolioGallery columns={vw < 560 ? 2 : vw < 980 ? 3 : 4}
                    filters={['Todos', 'Cabello', 'Color', 'Barbería', 'Uñas']}
                    activeFilter={pfilter} onFilter={setPfilter}
                    images={portfolioImages}
                    onOpen={(img, i) => {
                      // Resolve the clicked image by its identity (src/id) within
                      // the CURRENT filtered list, so the lightbox always opens the
                      // exact image clicked — never relying solely on the visual
                      // index, which masonry/filter ordering can desync.
                      const id = typeof img === 'string' ? img : (img && (img.id || img.src));
                      const idx = portfolioImages.findIndex((p) => (typeof p === 'string' ? p : (p && (p.id || p.src))) === id);
                      setLightbox(idx >= 0 ? idx : i);
                    }} />
                </div>
              )}

              {tab === 'resenas' && (
                <div>
                  <SectionHead title="Reseñas" sub="Conoce la experiencia de otros clientes antes de reservar." />

                  {/* Rating summary — compact, left-aligned block */}
                  <div style={{
                    maxWidth: 600, background: 'var(--rz-gray-050)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)', padding: 'clamp(18px,2.2vw,24px) clamp(20px,2.6vw,28px)', marginBottom: 24,
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(20px,3vw,32px)',
                  }}>
                    <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 44, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1, letterSpacing: '-0.5px' }}>
                        {REVIEW_SUMMARY.avg.toFixed(1)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                          {[0, 1, 2, 3, 4].map((i) => (
                            <Glyph key={i} name="star" size={15} filled style={{ color: i < Math.round(REVIEW_SUMMARY.avg) ? 'var(--rz-gold)' : 'var(--rz-gray-200)' }} />
                          ))}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--rz-gray-600)', fontWeight: 600 }}>{REVIEW_SUMMARY.total} reseñas</div>
                      </div>
                    </div>
                    <div style={{ alignSelf: 'stretch', width: 1, background: 'var(--border-subtle)' }} />
                    <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const pct = Math.round((REVIEW_SUMMARY.dist[star] / REVIEW_SUMMARY.total) * 100);
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, width: 22, flex: 'none', fontSize: 12, fontWeight: 600, color: 'var(--rz-gray-700)' }}>
                              {star}<Glyph name="star" size={11} filled style={{ color: 'var(--rz-gold)' }} />
                            </span>
                            <div style={{ flex: 1, height: 6, background: 'var(--rz-gray-200)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--rz-gold)', borderRadius: 'var(--radius-pill)', transition: 'width var(--dur-slow) var(--ease-out)' }} />
                            </div>
                            <span style={{ width: 32, flex: 'none', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--rz-gray-500)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filters — chips + compact star pill */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 24 }}>
                    {[{ key: 'todas', label: 'Todas' }, { key: 'comentario', label: 'Con comentario' }, { key: 'recientes', label: 'Más recientes' }].map((f) => (
                      <Chip key={f.key} active={reviewFilter === f.key} uppercase={false} onClick={() => { setReviewFilter(f.key); setStarMenuOpen(false); }}>{f.label}</Chip>
                    ))}
                    {(() => {
                      const STAR_OPTS = [{ label: '5 estrellas', value: '5' }, { label: '4 estrellas', value: '4' }, { label: '3 estrellas', value: '3' }, { label: '2 estrellas', value: '2' }, { label: '1 estrella', value: '1' }];
                      const isStar = ['5', '4', '3', '2', '1'].includes(reviewFilter);
                      const current = STAR_OPTS.find((o) => o.value === reviewFilter);
                      return (
                        <div style={{ position: 'relative' }} data-star-filter>
                          <button
                            onClick={() => setStarMenuOpen((o) => !o)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px',
                              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, letterSpacing: 'var(--ls-tight)',
                              borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                              background: isStar ? 'var(--rz-navy)' : 'var(--surface-card)',
                              color: isStar ? '#fff' : 'var(--rz-gray-700)',
                              border: isStar ? '1.5px solid var(--rz-navy)' : '1.5px solid var(--border-default)',
                              transition: 'all var(--dur-base)',
                            }}
                            onMouseEnter={(e) => { if (!isStar) { e.currentTarget.style.borderColor = 'var(--rz-coral)'; e.currentTarget.style.color = 'var(--rz-coral)'; } }}
                            onMouseLeave={(e) => { if (!isStar) { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--rz-gray-700)'; } }}
                          >
                            <Glyph name="star" size={14} filled style={{ color: isStar ? 'var(--rz-gold)' : 'var(--rz-gray-400)' }} />
                            {current ? current.label : 'Filtrar por estrellas'}
                            <Glyph name="chevronDown" size={15} style={{ transform: starMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-base)', opacity: 0.85 }} />
                          </button>
                          {starMenuOpen && (
                            <div style={{
                              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 30, minWidth: 170,
                              background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: 6,
                            }}>
                              {STAR_OPTS.map((o) => (
                                <button
                                  key={o.value}
                                  onClick={() => { setReviewFilter(o.value); setStarMenuOpen(false); }}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%',
                                    padding: '9px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                                    background: o.value === reviewFilter ? 'var(--rz-coral-050)' : 'transparent',
                                    borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)', fontSize: 14,
                                    color: o.value === reviewFilter ? 'var(--rz-coral-700)' : 'var(--rz-gray-700)', fontWeight: o.value === reviewFilter ? 600 : 400,
                                  }}
                                  onMouseEnter={(e) => { if (o.value !== reviewFilter) e.currentTarget.style.background = 'var(--rz-gray-100)'; }}
                                  onMouseLeave={(e) => { if (o.value !== reviewFilter) e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <Glyph name="star" size={13} filled style={{ color: 'var(--rz-gold)' }} />{o.label}
                                  </span>
                                  {o.value === reviewFilter && <Glyph name="check" size={15} />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Review cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {shownReviews.map((r) => (
                      <div key={r.id} style={{
                        background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)', padding: 'clamp(18px,2.4vw,24px)', boxShadow: 'var(--shadow-xs)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          <Avatar src={r.photo || undefined} name={r.name} size={48} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--rz-navy)' }}>{r.name}</div>
                                <div style={{ fontSize: 13, color: 'var(--rz-gray-500)', marginTop: 2 }}>{r.date}</div>
                              </div>
                              <div style={{ display: 'inline-flex', gap: 2, flex: 'none' }}>
                                {[0, 1, 2, 3, 4].map((i) => (
                                  <Glyph key={i} name="star" size={15} filled style={{ color: i < r.rating ? 'var(--rz-gold)' : 'var(--rz-gray-200)' }} />
                                ))}
                              </div>
                            </div>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10,
                              fontSize: 12, fontWeight: 600, color: 'var(--rz-navy)',
                              background: 'var(--rz-navy-050)', padding: '4px 10px', borderRadius: 'var(--radius-pill)',
                            }}>
                              <Glyph name="scissors" size={12} style={{ color: 'var(--rz-coral)' }} />{r.service}
                            </span>
                            {r.comment && r.comment.trim() && (
                              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--rz-gray-700)', marginTop: 12, textWrap: 'pretty' }}>{r.comment}</p>
                            )}
                            {r.response && (
                              <div style={{
                                marginTop: 14, padding: '12px 16px', background: 'var(--rz-gray-050)',
                                borderLeft: '3px solid var(--rz-coral)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                              }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: 'var(--ls-wide)', textTransform: 'uppercase' }}>
                                  <Glyph name="shield" size={13} style={{ color: 'var(--rz-coral)' }} />Respuesta del negocio
                                </div>
                                <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--rz-gray-600)', marginTop: 6, textWrap: 'pretty' }}>{r.response}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredReviews.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--rz-gray-500)', fontSize: 14 }}>
                      No hay reseñas que coincidan con este filtro.
                    </div>
                  )}

                  {filteredReviews.length > REVIEWS_LIMIT && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                      <Button variant="outline" onClick={() => setReviewsExpanded((e) => !e)}
                        rightIcon={<Glyph name="chevronDown" size={16} style={{ transform: reviewsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-base)' }} />}>
                        {reviewsExpanded ? 'Ver menos' : `Ver más reseñas (${filteredReviews.length - REVIEWS_LIMIT})`}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {tab === 'amenidades' && (() => {
                // Inline Lucide icon paths — kept local so amenities render
                // independent of the shared icon bundle.
                const AICON = {
                  wifi: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
                  snowflake: '<line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>',
                  sofa: '<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="M4 18v2"/><path d="M20 18v2"/><path d="M12 4v9"/>',
                  coffee: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
                  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
                  accessibility: '<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-3.76-7.49"/>',
                  pawPrint: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
                  creditCard: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
                  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
                  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
                  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
                  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
                };
                const AIcon = ({ name, size = 19 }) => (
                  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flex: 'none' }}
                    dangerouslySetInnerHTML={{ __html: AICON[name] }} />
                );
                return (
                <div>
                  <SectionHead title="Amenidades" sub="Conoce las comodidades y facilidades disponibles en este negocio." />
                  {[
                    { group: 'Comodidades', items: [
                      { icon: 'wifi', name: 'Wi-Fi gratis' },
                      { icon: 'snowflake', name: 'Aire acondicionado' },
                      { icon: 'sofa', name: 'Sala de espera' },
                      { icon: 'coffee', name: 'Bebidas de cortesía' },
                    ] },
                    { group: 'Facilidades', items: [
                      { icon: 'car', name: 'Estacionamiento' },
                      { icon: 'accessibility', name: 'Acceso movilidad reducida' },
                      { icon: 'pawPrint', name: 'Pet friendly' },
                      { icon: 'creditCard', name: 'Acepta tarjetas' },
                    ] },
                    { group: 'Experiencia', items: [
                      { icon: 'music', name: 'Música ambiente' },
                      { icon: 'lock', name: 'Ambiente privado' },
                      { icon: 'user', name: 'Atención personalizada' },
                      { icon: 'sparkles', name: 'Productos profesionales' },
                    ] },
                  ].map((cat) => (
                    <div key={cat.group} style={{ marginBottom: 28 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--rz-gray-500)', marginBottom: 14 }}>{cat.group}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${vw < 560 ? 2 : vw < 880 ? 3 : 4}, 1fr)`, gap: 12 }}>
                        {cat.items.map((a) => (
                          <div key={a.name} className="rz-amenity"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                              background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-md)', transition: 'border-color var(--dur-base), box-shadow var(--dur-base), transform var(--dur-base)',
                            }}>
                            <span style={{
                              flex: 'none', width: 38, height: 38, borderRadius: 'var(--radius-sm)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--rz-coral-050)', color: 'var(--rz-coral)',
                            }}>
                              <AIcon name={a.icon} size={19} />
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-navy)', lineHeight: 1.3 }}>{a.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Glyph name="helpCircle" size={14} style={{ color: 'var(--rz-gray-400)' }} />
                    Las amenidades pueden variar según disponibilidad del negocio.
                  </p>
                </div>
                );
              })()}
            </div>
          </div>

          {/* Sidebar */}
          <BusinessInfoPanel
            name="Luxe Hair Studio"
            mapNode={<VenueMiniMap lat={VENUE_COORDS.lat} lng={VENUE_COORDS.lng} label="Mapa de Luxe Hair Studio" />}
            address="Ave. Balboa, Calle Uruguay 405, Ciudad de Panamá"
            about="Encuéntranos en Luxe Hair Studio, Avenida Balboa, Calle Uruguay, Ciudad de Panamá."
            todayHours="9:00 AM – 8:00 PM"
            weekHours={WEEK_HOURS}
            phone="(507) 6649-0428"
            email="info@luxehairprma.com"
            socials={['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'x']}
            links={['Política de pago y cancelación', 'Reportar negocio']}
            onLinkClick={(label, i) => setInfoModal(LINK_CONTENT[i])}
            onDirections={openDirections}
          />
        </div>
      </div>

      {/* Categories */}
      <div style={{ background: 'var(--rz-gray-050)', marginTop: 56, padding: `52px ${PAD}` }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto' }}>
          <SectionHead title="Elige tu categoría" sub="DESCUBRE EL SERVICIO PERFECTO PARA TI" />
          {vw >= 980 ? (
            // Desktop / laptop — all categories in one clean row (tighter gap on laptop).
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${RZ.categories.length},1fr)`, gap: vw < 1200 ? 10 : 14 }}>
              {RZ.categories.map((c, i) => <CategoryCard key={i} image={c.img} title={c.title} />)}
            </div>
          ) : (
            // Tablet / mobile — horizontal scroll instead of awkward wrapping.
            <div className="rz-scroll-thin" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10, scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
              {RZ.categories.map((c, i) => (
                <div key={i} style={{ flex: 'none', width: vw < 600 ? 150 : 180, scrollSnapAlign: 'start' }}>
                  <CategoryCard image={c.img} title={c.title} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer logoSrc={logoW} columns={RZ.footerColumns} socials={['instagram', 'facebook', 'linkedin', 'x']} contentMax="min(94vw, 1600px)" />

      {/* ---- Portfolio Lightbox / fullscreen gallery viewer ---- */}
      {lightbox != null && portfolioImages[lightbox] && (
        <div
          role="dialog" aria-modal="true" aria-label="Galería de portafolio"
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2147483000,
            background: 'rgba(8, 17, 26, 0.94)', backdropFilter: 'blur(2px)',
            display: 'flex', flexDirection: 'column',
            animation: 'rz-lb-fade var(--dur-base) var(--ease-standard)',
          }}
        >
          {/* Top bar: counter + close */}
          <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(14px,2vw,22px) clamp(16px,3vw,28px)', color: '#fff' }}>
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.02em', opacity: 0.9, fontVariantNumeric: 'tabular-nums' }}>{lightbox + 1} / {lbCount}</span>
            <button onClick={(e) => { e.stopPropagation(); setLightbox(null); }} aria-label="Cerrar"
              style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background var(--dur-fast)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}>
              <Glyph name="close" size={22} />
            </button>
          </div>

          {/* Stage: prev / image / next */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px,2vw,20px)', padding: '0 clamp(10px,2vw,24px)' }}>
            {lbCount > 1 && (
              <button onClick={(e) => { e.stopPropagation(); lbPrev(); }} aria-label="Imagen anterior" style={lbArrow(vw)}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}>
                <Glyph name="chevronLeft" size={26} />
              </button>
            )}
            <div
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => { lbTouch.current = e.changedTouches[0].clientX; }}
              onTouchEnd={(e) => {
                const dx = e.changedTouches[0].clientX - lbTouch.current;
                if (Math.abs(dx) > 50) { dx < 0 ? lbNext() : lbPrev(); }
              }}
              style={{ flex: 1, maxWidth: 'min(1100px, 92vw)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img key={lightbox} src={portfolioImages[lightbox].src} alt={portfolioImages[lightbox].alt || ''}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', animation: 'rz-lb-pop var(--dur-base) var(--ease-standard)' }} />
            </div>
            {lbCount > 1 && (
              <button onClick={(e) => { e.stopPropagation(); lbNext(); }} aria-label="Imagen siguiente" style={lbArrow(vw)}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}>
                <Glyph name="chevronRight" size={26} />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {lbCount > 1 && (
            <div className="rz-scroll-thin" onClick={(e) => e.stopPropagation()}
              style={{ flex: 'none', display: 'flex', gap: 8, justifyContent: 'flex-start', overflowX: 'auto', padding: 'clamp(12px,2vw,18px) clamp(16px,3vw,28px)', maxWidth: 'min(1100px, 96vw)', margin: '0 auto', width: '100%' }}>
              {portfolioImages.map((p, i) => (
                <button key={i} onClick={() => setLightbox(i)} aria-label={`Ver imagen ${i + 1}`}
                  style={{ flex: 'none', width: 64, height: 48, borderRadius: 'var(--radius-sm)', overflow: 'hidden', cursor: 'pointer', padding: 0, border: i === lightbox ? '2px solid var(--rz-coral)' : '2px solid transparent', opacity: i === lightbox ? 1 : 0.55, transition: 'opacity var(--dur-fast)' }}>
                  <img src={p.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer-link placeholder route */}
      {infoModal && (
        <Modal open onClose={() => setInfoModal(null)} width={460}>
          <div style={{ padding: 'clamp(26px,4vw,34px) clamp(24px,4vw,32px)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: '-0.3px' }}>{infoModal.title}</h2>
            <p style={{ fontSize: 14.5, color: 'var(--rz-gray-600)', lineHeight: 1.6, marginTop: 12 }}>{infoModal.body}</p>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={() => setInfoModal(null)}>Entendido</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 200, display: 'flex', alignItems: 'center', gap: 9, background: 'var(--rz-navy)', color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-lg)', fontSize: 14, fontWeight: 600 }}>
          <Glyph name="check" size={16} /> {toast}
        </div>
      )}
    </div>
  );
}
window.VenuePage = VenuePage;
