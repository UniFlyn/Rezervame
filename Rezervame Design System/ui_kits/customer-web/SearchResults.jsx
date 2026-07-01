/* Search Results / Business Listing screen — Rezervame.
   Used for: all businesses, search results, category results, "cerca de mí",
   recomendados / mejor valorados / nuevos / promociones filtered views.
   Layout: left filters panel · results (list default, grid optional) · right map.
   Responsive: desktop = filters + results + map; tablet = collapsible filters +
   results + optional map; mobile = results first, filters as bottom sheet, map toggle. */
/* Interactive results map — a real OpenStreetMap (Leaflet) base so it looks
   like an actual map, not an illustration. Leaflet handles drag-pan, wheel &
   pinch zoom; the price markers and the compact business card are React
   overlays positioned from the map's lat/lng → pixel projection (so they track
   the map on every pan/zoom). Top-level (stable identity) so map + selection
   survive parent re-renders. */
function ResultsMap({ results, active, setActive, onOpenVenue, anchored = true }) {
  const DS = window.RezervameDesignSystem_4317c4;
  const { MapMarker, MapCard, Glyph } = DS;
  const RZ = window.RZ;
  const elRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const [, setTick] = React.useState(0);
  const bump = React.useCallback(() => setTick((t) => (t + 1) % 1e9), []);

  // Bella Vista / Calidonia, Ciudad de Panamá — businesses spread over land.
  const CENTER = [8.9762, -79.5330];
  const ZOOM = 15;
  const LATLNG = [
    [8.9786, -79.5346], [8.9761, -79.5302], [8.9740, -79.5322], [8.9806, -79.5360],
    [8.9754, -79.5366], [8.9776, -79.5311], [8.9726, -79.5296], [8.9731, -79.5351],
  ];

  React.useEffect(() => {
    const L = window.L;
    if (!L || !elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, {
      center: CENTER, zoom: ZOOM, zoomControl: false, attributionControl: false,
      zoomAnimation: false, minZoom: 13, maxZoom: 18,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    map.on('move zoom viewreset', bump);
    setTimeout(() => { map.invalidateSize(); bump(); }, 60);
    bump();
    return () => { map.off(); map.remove(); mapRef.current = null; };
  }, []);

  // keep Leaflet sized to its (responsive) container
  React.useEffect(() => {
    const el = elRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => { if (mapRef.current) { mapRef.current.invalidateSize(); bump(); } });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const map = mapRef.current;
  const W = elRef.current ? elRef.current.clientWidth : 0;
  const H = elRef.current ? elRef.current.clientHeight : 0;
  const ptOf = (i) => {
    if (!map || !window.L) return null;
    const p = map.latLngToContainerPoint(window.L.latLng(LATLNG[i % LATLNG.length]));
    return { x: p.x, y: p.y };
  };

  const ctrlBtn = { width: 38, height: 38, border: 'none', background: 'var(--surface-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rz-navy)' };
  const CARD_W = 200, CARD_H = 212, PAD = 10;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#e8ecef', zIndex: 0, isolation: 'isolate' }}>
      {/* Leaflet map surface */}
      <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />

      {/* React overlay — markers + selected card, projected from lat/lng */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 500 }}>
        {map && results.map((b) => {
          const p = ptOf(b._i);
          if (!p) return null;
          const isActive = active === b._i;
          return (
            <div key={b._i} onClick={() => setActive(b._i)}
              style={{ position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%, -100%)', pointerEvents: 'auto', cursor: 'pointer', zIndex: isActive ? 30 : 10 }}>
              <MapMarker variant="price" label={`$${b.priceFrom}`} active={isActive} dimmed={active != null && !isActive} />
            </div>
          );
        })}

        {map && active != null && (() => {
          const b = RZ.businesses[active]; if (!b) return null;
          const p = ptOf(active); if (!p) return null;
          const sx = p.x, sy = p.y;
          // Drop the card below the pin so the marker stays visible; flip above
          // only when there's no room, and clamp inside the map viewport.
          const MARK = 50;
          const below = (sy + 14 + CARD_H + PAD) <= H;
          const left = Math.max(PAD, Math.min(W - CARD_W - PAD, sx - CARD_W / 2));
          const top = Math.max(PAD, Math.min(H - CARD_H - PAD, below ? sy + 14 : sy - MARK - CARD_H));
          return (
            <div style={{ position: 'absolute', left, top, width: CARD_W, pointerEvents: 'auto', zIndex: 45 }}>
              <div style={{ position: 'relative' }}>
                <button onClick={(e) => { e.stopPropagation(); setActive(null); }} aria-label="Cerrar" style={{ position: 'absolute', top: 8, right: 8, zIndex: 3, width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.94)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rz-gray-600)' }}><Glyph name="close" size={14} /></button>
                <MapCard compact image={b.img} category={b.category} name={b.name} rating={b.rating} distance={b.distance} address={b.location} onCta={() => onOpenVenue(b)} onClick={() => onOpenVenue(b)} width="100%" />
              </div>
            </div>
          );
        })()}
      </div>

      {/* zoom + recenter controls */}
      <div style={{ position: 'absolute', bottom: 16, right: 14, display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', background: 'var(--surface-card)', zIndex: 600 }}>
        <button aria-label="Acercar" onClick={() => mapRef.current && mapRef.current.zoomIn()} style={{ ...ctrlBtn, borderBottom: '1px solid var(--border-subtle)' }}><Glyph name="plus" size={18} /></button>
        <button aria-label="Alejar" onClick={() => mapRef.current && mapRef.current.zoomOut()} style={{ ...ctrlBtn, borderBottom: '1px solid var(--border-subtle)' }}><span style={{ width: 14, height: 2, borderRadius: 1, background: 'var(--rz-navy)' }} /></button>
        <button aria-label="Recentrar" onClick={() => mapRef.current && mapRef.current.setView(CENTER, ZOOM)} style={ctrlBtn}><Glyph name="navigation" size={17} /></button>
      </div>
      <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 10, color: '#5b6470', background: 'rgba(255,255,255,0.72)', padding: '1px 6px', borderRadius: 4, zIndex: 600 }}>© OpenStreetMap</div>
    </div>
  );
}

function SearchResults({ onOpenVenue, onHome, onSearch, onLogin, onJoinBusiness, context, isLoggedIn, user, favorites, onToggleFav, onAccount, onFavorites, onViewHistory, onLogout }) {
  const DS = window.RezervameDesignSystem_4317c4;
  const {
    Header, Footer, Button, Chip, Checkbox, Radio, Select, IconButton, Badge,
    BusinessCard, MapMarker, MapCard, MapControls, Glyph,
  } = DS;
  const RZ = window.RZ;

  // Canonical DS components once the bundle includes them; identical local
  // fallbacks cover the brief window before the bundle is recompiled.
  // ---- Search-results LIST ROW (compact, equal-height, comparison-focused) ----
  const BusinessListItem = DS.BusinessListItem || function LocalRow({
    image, name, rating, reviews, category, location, distance, services = [],
    hoursToday, priceFrom, priceTo, badge, badgeTone = 'coral', favorite, onFavorite,
    onClick, onReserve, ctaLabel = 'Rezervame', active, onMouseEnter, onMouseLeave,
  }) {
    const [hover, setHover] = React.useState(false);
    const lifted = hover || active;
    const shown = services.slice(0, 3);
    const extra = Math.max(0, services.length - 3);
    return (
      <div onClick={onClick}
        onMouseEnter={(e) => { setHover(true); onMouseEnter && onMouseEnter(e); }}
        onMouseLeave={(e) => { setHover(false); onMouseLeave && onMouseLeave(e); }}
        style={{ display: 'flex', height: 168, background: 'var(--surface-card)', border: `1.5px solid ${active ? 'var(--rz-coral)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-lg)', boxShadow: lifted ? '0 12px 28px rgba(2,48,71,0.10)' : '0 2px 8px rgba(2,48,71,0.05)', overflow: 'hidden', cursor: 'pointer', transform: lifted ? 'translateY(-2px)' : 'none', transition: 'all var(--dur-base) var(--ease-standard)' }}>
        <div style={{ position: 'relative', flex: 'none', width: 224, height: '100%', background: 'var(--rz-gray-100)', overflow: 'hidden' }}>
          {image && <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: lifted ? 'scale(1.05)' : 'scale(1)', transition: 'transform var(--dur-slow) var(--ease-out)' }} />}
          {badge && <span style={{ position: 'absolute', top: 12, left: 12 }}><Badge tone={badgeTone} size="sm">{badge}</Badge></span>}
          <button aria-label="favorito" onClick={(e) => { e.stopPropagation(); onFavorite && onFavorite(); }} style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.94)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: favorite ? 'var(--rz-coral)' : 'var(--rz-gray-600)', boxShadow: 'var(--shadow-sm)' }}><Glyph name="heart" size={17} filled={favorite} /></button>
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            {category ? <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rz-coral)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{category}</span> : <span />}
            {rating != null && <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Glyph name="star" size={14} filled style={{ color: 'var(--rz-gold)' }} /><span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--rz-navy)' }}>{Number(rating).toFixed(1)}</span>{reviews != null && <span style={{ fontSize: 12.5, color: 'var(--rz-gray-400)' }}>({reviews})</span>}</span>}
          </div>
          <h4 style={{ fontSize: 19, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1.2, letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</h4>
          {(location || distance) && <p style={{ fontSize: 13, color: 'var(--rz-gray-500)', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><Glyph name="mapPin" size={13} style={{ color: 'var(--rz-gray-400)', flex: 'none' }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{[location, distance].filter(Boolean).join(' · ')}</span></p>}
          {shown.length > 0 && <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, alignItems: 'center', overflow: 'hidden' }}>{shown.map((s, i) => <span key={i} style={{ flex: 'none', fontSize: 11.5, color: 'var(--rz-gray-600)', background: 'var(--rz-gray-100)', padding: '3px 9px', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap', maxWidth: 132, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>)}{extra > 0 && <span style={{ flex: 'none', fontSize: 11.5, fontWeight: 600, color: 'var(--rz-coral)', whiteSpace: 'nowrap' }}>+{extra}</span>}</div>}
          {hoursToday && <span style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--rz-gray-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ flex: 'none', width: 7, height: 7, borderRadius: '50%', background: 'var(--rz-success)' }} /><span style={{ fontWeight: 600, color: 'var(--rz-success)' }}>Hoy</span><span style={{ color: 'var(--rz-gray-300)' }}>·</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{hoursToday}</span></span>}
        </div>
        <div style={{ flex: 'none', width: 168, padding: '14px 18px', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'space-between', gap: 14 }}>
          {priceFrom != null ? <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--rz-gray-400)' }}>Desde</div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1.1, marginTop: 1 }}>${priceFrom}</div></div> : <span />}
          <Button variant="primary" size="sm" fullWidth style={{ fontSize: 14.5 }} onClick={(e) => { e.stopPropagation(); (onReserve || onClick)(); }}>{ctaLabel}</Button>
        </div>
      </div>
    );
  };

  // ---- Search-results GRID CARD (denser than Home BusinessCard) ----
  const BusinessResultCard = DS.BusinessResultCard || function LocalResultCard({
    image, name, rating, reviews, category, location, distance, services = [],
    hoursToday, priceFrom, priceTo, badge, badgeTone = 'coral', favorite, onFavorite,
    onClick, onReserve, ctaLabel = 'Rezervame',
  }) {
    const [hover, setHover] = React.useState(false);
    const shown = services.slice(0, 1);
    const extra = Math.max(0, services.length - 1);
    return (
      <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: hover ? '0 12px 28px rgba(2,48,71,0.10)' : '0 2px 8px rgba(2,48,71,0.05)', overflow: 'hidden', cursor: 'pointer', transform: hover ? 'translateY(-3px)' : 'none', transition: 'transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)' }}>
        <div style={{ position: 'relative', aspectRatio: '4 / 3', flex: 'none', background: 'var(--rz-gray-100)', overflow: 'hidden' }}>
          {image && <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: hover ? 'scale(1.05)' : 'scale(1)', transition: 'transform var(--dur-slow) var(--ease-out)' }} />}
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(2,48,71,0.20) 0%, rgba(2,48,71,0) 24%, rgba(2,48,71,0) 72%, rgba(2,48,71,0.22) 100%)' }} />
          {badge && <span style={{ position: 'absolute', top: 10, left: 10 }}><Badge tone={badgeTone} size="sm">{badge}</Badge></span>}
          <button aria-label="favorito" onClick={(e) => { e.stopPropagation(); onFavorite && onFavorite(); }} style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.94)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: favorite ? 'var(--rz-coral)' : 'var(--rz-gray-600)', boxShadow: 'var(--shadow-sm)' }}><Glyph name="heart" size={17} filled={favorite} /></button>
          {rating != null && <span style={{ position: 'absolute', bottom: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 9px', borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.96)', boxShadow: 'var(--shadow-sm)' }}><Glyph name="star" size={13} filled style={{ color: 'var(--rz-gold)' }} /><span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1 }}>{Number(rating).toFixed(1)}</span>{reviews != null && <span style={{ fontSize: 11.5, color: 'var(--rz-gray-400)', lineHeight: 1 }}>({reviews})</span>}</span>}
        </div>
        <div style={{ padding: '12px 14px 13px', display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minHeight: 0 }}>
          {category && <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rz-coral)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{category}</span>}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <h4 style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1.2, letterSpacing: '-0.25px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</h4>
            {priceFrom != null && <div style={{ flex: 'none', textAlign: 'right', lineHeight: 1 }}><div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--rz-gray-400)' }}>Desde</div><div style={{ fontSize: 17, fontWeight: 700, color: 'var(--rz-navy)', lineHeight: 1.15, marginTop: 2 }}>${priceFrom}</div></div>}
          </div>
          {(location || distance) && <p style={{ fontSize: 12.5, color: 'var(--rz-gray-500)', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><Glyph name="mapPin" size={13} style={{ color: 'var(--rz-gray-400)', flex: 'none' }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{[location, distance].filter(Boolean).join(' · ')}</span></p>}
          {shown.length > 0 && <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, alignItems: 'center', overflow: 'hidden' }}>{shown.map((s, i) => <span key={i} style={{ flex: 'none', fontSize: 11.5, color: 'var(--rz-gray-600)', background: 'var(--rz-gray-100)', padding: '3px 9px', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>)}{extra > 0 && <span style={{ flex: 'none', fontSize: 11.5, fontWeight: 600, color: 'var(--rz-coral)', whiteSpace: 'nowrap' }}>+{extra}</span>}</div>}
          <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
            {hoursToday && <span style={{ flex: 1, minWidth: 0, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--rz-gray-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ flex: 'none', width: 7, height: 7, borderRadius: '50%', background: 'var(--rz-success)' }} /><span style={{ fontWeight: 600, color: 'var(--rz-success)' }}>Hoy</span><span style={{ color: 'var(--rz-gray-300)' }}>·</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{hoursToday}</span></span>}
            <Button variant="outline" size="sm" style={{ flex: 'none', fontSize: 13.5 }} onClick={(e) => { e.stopPropagation(); (onReserve || onClick)(); }}>{ctaLabel}</Button>
          </div>
        </div>
      </div>
    );
  };
  const logo = '../../assets/logos/rezervame-color.png';
  const logoW = '../../assets/logos/rezervame-white.png';

  context = context || {};

  // ---- viewport ----
  const [vw, setVw] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  React.useEffect(() => {
    const onR = () => setVw(window.innerWidth);
    window.addEventListener('resize', onR, { passive: true });
    return () => window.removeEventListener('resize', onR);
  }, []);
  const isDesktop = vw >= 1080;
  // Side-by-side map needs comfortable room for filters + readable list rows +
  // map; below this width the map reflows beneath the results instead.
  const isWide = vw >= 1280;
  const isTablet = vw >= 720 && vw < 1080;
  const isMobile = vw < 720;

  // Booksy/Airbnb-style locked layout: on desktop the three columns fill the
  // viewport and the results list scrolls inside its OWN area below the toolbar
  // (cards never pass behind the toolbar). Tablet/mobile keep normal page flow.
  const lock = isDesktop;
  const LOCK_OFFSET = 128; // header (84) + body top padding (24) + breathing room

  // Measure the results toolbar so the map-controls row can match its exact
  // height — guarantees the map top lines up with the first business card even
  // when the toolbar wraps to two lines.
  const toolbarRef = React.useRef(null);
  const [toolbarH, setToolbarH] = React.useState(0);
  React.useEffect(() => {
    const el = toolbarRef.current; if (!el) return;
    const measure = () => setToolbarH(el.offsetHeight);
    measure();
    let ro;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(measure); ro.observe(el); }
    window.addEventListener('resize', measure);
    return () => { ro && ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  // ---- sticky-toolbar "stuck" detection (drives the divider + soft shadow) ----
  // A sentinel just above the toolbar + IntersectionObserver: when the sentinel
  // scrolls above the header line the toolbar is pinned. Toggling box-shadow
  // causes no layout shift, so the results never jump when it pins.
  const stickySentinelRef = React.useRef(null);
  const [stuck, setStuck] = React.useState(false);
  React.useEffect(() => {
    const el = stickySentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setStuck(entry.boundingClientRect.top < 84.5),
      { root: null, rootMargin: '-84px 0px 0px 0px', threshold: [0, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ---- filter model ----
  const CATS = ['Cabello', 'Barbería', 'Uñas', 'Spa', 'Belleza', 'Depilación'];
  const allCats = {}; CATS.forEach((c) => { allCats[c] = false; });
  const [cats, setCats] = React.useState(() => {
    const init = { ...allCats };
    if (context.category && init.hasOwnProperty(context.category)) init[context.category] = true;
    return init;
  });
  const [minRating, setMinRating] = React.useState(0);     // 0 = todas
  const [maxDist, setMaxDist] = React.useState(0);          // 0 = cualquiera (km)
  const [price, setPrice] = React.useState(0);              // 0 todos · 1 $ · 2 $$ · 3 $$$
  const [availToday, setAvailToday] = React.useState(false);
  const [promosOnly, setPromosOnly] = React.useState(false);
  const [sort, setSort] = React.useState('relevancia');
  const [sortOpen, setSortOpen] = React.useState(false);

  const [view, setView] = React.useState('list');
  const [showMap, setShowMap] = React.useState(true);
  const [filtersOpen, setFiltersOpen] = React.useState(false); // mobile/tablet sheet
  const [active, setActive] = React.useState(null);            // selected business index (map link)
  const [query, setQuery] = React.useState(context.query || '');
  // When true, force the "Todos los negocios" view regardless of the incoming
  // context title (used by the empty-state "Ver todos los negocios" action).
  const [forceAll, setForceAll] = React.useState(false);
  React.useEffect(() => { setQuery(context.query || ''); setForceAll(false); }, [context.query, context.title]);
  // New SearchBar passes {service}; older cached bundle passes a click event —
  // fall back to reading the header input value.
  const readQuery = (q) => {
    if (q && typeof q.service === 'string') return q.service;
    const root = (q && q.currentTarget && q.currentTarget.closest && q.currentTarget.closest('header')) || document.querySelector('header');
    const input = root && root.querySelector('input');
    return input ? input.value.trim() : '';
  };

  // favorites are owned by the app (auth-gated); local fallback keeps the
  // component usable standalone.
  const [localFav, setLocalFav] = React.useState({});
  const fav = favorites || localFav;
  const toggleFav = onToggleFav || ((i) => setLocalFav((f) => ({ ...f, [i]: !f[i] })));
  const clearFilters = () => {
    setCats({ ...allCats }); setMinRating(0); setMaxDist(0); setPrice(0);
    setAvailToday(false); setPromosOnly(false); setQuery('');
  };
  // Reset everything AND drop the inbound category context — show all businesses.
  const showAllBusinesses = () => { clearFilters(); setForceAll(true); };

  // Map visibility drives the default results view: visible → List, hidden → Grid.
  // A manual List/Grid choice is respected until the map is toggled again.
  const showMapList = () => { setShowMap(true); setView('list'); };
  const hideMapGrid = () => { setShowMap(false); setView('grid'); };

  // ---- keyword search (mock, synonym-aware) ----
  const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const SYN = {
    Cabello: ['cabello', 'corte', 'color', 'coloracion', 'balayage', 'highlights', 'keratina', 'peinado', 'blower', 'secado', 'pelo'],
    'Barbería': ['barber', 'barberia', 'fade', 'afeitado', 'barba', 'grooming'],
    'Uñas': ['unas', 'manicure', 'pedicure', 'acrilic', 'esmalte'],
    Spa: ['spa', 'masaje', 'facial', 'aromaterapia', 'sauna', 'bienestar', 'relaj'],
    Belleza: ['belleza', 'maquillaje', 'cejas', 'pestanas', 'estetica'],
    'Depilación': ['depila', 'cera', 'laser', 'wax'],
  };
  const queryMatch = (b, qRaw) => {
    const q = norm(qRaw);
    if (!q) return true;
    const hay = norm(`${b.name} ${b.category} ${(b.services || []).join(' ')}`);
    if (hay.includes(q)) return true;
    for (const [cat, words] of Object.entries(SYN)) {
      if (words.some((w) => q.includes(w) || w.includes(q))) {
        if (norm(b.category) === norm(cat)) return true;
        if (words.some((w) => hay.includes(w))) return true;
      }
    }
    return false;
  };

  // ---- derived list ----
  const activeCats = CATS.filter((c) => cats[c]);
  const distKm = (b) => parseFloat(b.distance) || 0;
  const priceBucket = (b) => (b.priceFrom <= 40 ? 1 : b.priceFrom <= 80 ? 2 : 3);
  // Opening time in minutes from midnight, parsed from "09:00 AM – 06:00 PM" —
  // a proxy for "soonest availability" sorting (earlier open = sooner).
  const openMin = (b) => {
    const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(b.hoursToday || '');
    if (!m) return 24 * 60;
    let h = parseInt(m[1], 10) % 12; if (/PM/i.test(m[3])) h += 12;
    return h * 60 + parseInt(m[2], 10);
  };

  let results = RZ.businesses.map((b, i) => ({ ...b, _i: i }));
  if (query.trim()) results = results.filter((b) => queryMatch(b, query));
  if (activeCats.length) results = results.filter((b) => activeCats.includes(b.category));
  if (minRating) results = results.filter((b) => b.rating >= minRating);
  if (maxDist) results = results.filter((b) => distKm(b) <= maxDist);
  if (price) results = results.filter((b) => priceBucket(b) === price);
  if (promosOnly) results = results.filter((b) => !!b.badge);
  // Price is handled by the "Rango de precio" filter, never as a sort option.
  if (sort === 'rating') results = [...results].sort((a, b) => b.rating - a.rating);
  else if (sort === 'distancia') results = [...results].sort((a, b) => distKm(a) - distKm(b));
  else if (sort === 'disponibilidad') results = [...results].sort((a, b) => openMin(a) - openMin(b));
  else if (sort === 'nuevos') results = [...results].sort((a, b) => (b.badge === 'Nuevo' ? 1 : 0) - (a.badge === 'Nuevo' ? 1 : 0));

  const activeFilterCount =
    activeCats.length + (minRating ? 1 : 0) + (maxDist ? 1 : 0) + (price ? 1 : 0) + (availToday ? 1 : 0) + (promosOnly ? 1 : 0);

  // ---- dynamic results title --------------------------------------------
  // The Search Results page is reached from many paths (search query, category
  // card, "Ver todos", "Cerca de mí", "Mejor valorados", "Nuevos", "Promociones").
  // The header title reflects HOW the user got here; there is no fixed default.
  const hasQuery = !!query.trim();
  // Filter model uses short labels — show the customer-facing category name when
  // a single category is the only active filter.
  const CAT_LABELS = {
    Cabello: 'Servicios para el cabello', 'Barbería': 'Barbería', 'Uñas': 'Cuidado de las uñas',
    Spa: 'Spa y bienestar', Belleza: 'Servicios de belleza', 'Depilación': 'Depilación',
  };
  // Normalise entry/section names to their results-page titles.
  const TITLE_ALIASES = { 'Cerca de mí': 'Negocios cerca de ti' };
  const nResults = results.length;
  const plural = (one, many) => (nResults === 1 ? one : many);
  let pageTitle, countLabel;
  if (nResults === 0) {
    // No matches — never show a misleading category/query title.
    pageTitle = 'Descubre el servicio perfecto para ti';
    countLabel = '0 resultados encontrados';
  } else if (hasQuery) {
    pageTitle = `Resultados para “${query.trim()}”`;
    countLabel = `${nResults} ${plural('resultado encontrado', 'resultados encontrados')}`;
  } else {
    const base = forceAll ? 'Todos los negocios'
      : (context.title
        || (activeCats.length === 1 ? (CAT_LABELS[activeCats[0]] || activeCats[0]) : null)
        || 'Todos los negocios');
    pageTitle = TITLE_ALIASES[base] || base;
    countLabel = `${nResults} ${plural('resultado', 'resultados')}`;
  }

  // ---- map marker positions (faux map surface) ----
  const MAP_POS = [
    { x: 30, y: 34 }, { x: 64, y: 22 }, { x: 78, y: 52 }, { x: 22, y: 64 },
    { x: 52, y: 70 }, { x: 44, y: 30 }, { x: 70, y: 78 }, { x: 16, y: 40 },
  ];

  // =================================================================== FILTERS
  const FilterSection = ({ title, children, last }) => (
    <div style={{ padding: '18px 0', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rz-gray-500)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--rz-coral)' }} />
        {title}
      </div>
      {children}
    </div>
  );

  const SORT_OPTIONS = [
    { value: 'relevancia', label: 'Recomendados' },
    { value: 'rating', label: 'Mejor valorados' },
    { value: 'distancia', label: 'Más cercanos' },
    { value: 'disponibilidad', label: 'Disponibilidad más próxima' },
    { value: 'nuevos', label: 'Nuevos en Rezervame' },
  ];

  // Compact sort control tuned for the filters sidebar: subtle neutral trigger,
  // coral accent only on focus/open, and a clean floating menu that fits its
  // five options (no internal scroll) instead of a heavy block.
  const OrdenarPor = (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setSortOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          width: '100%', height: 42, padding: '0 13px',
          background: 'var(--surface-card)',
          border: `1px solid ${sortOpen ? 'var(--rz-coral)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-md)', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--rz-gray-900)',
          boxShadow: sortOpen ? '0 0 0 3px var(--rz-coral-050)' : 'none',
          transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(SORT_OPTIONS.find((o) => o.value === sort) || SORT_OPTIONS[0]).label}</span>
        <Glyph name="chevronDown" size={16} style={{ color: 'var(--rz-gray-400)', flex: 'none', transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-base)' }} />
      </button>
      {sortOpen && (
        <React.Fragment>
          <div onClick={() => setSortOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 31,
            background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: 5,
          }}>
            {SORT_OPTIONS.map((o) => {
              const on = o.value === sort;
              return (
                <button key={o.value}
                  onClick={() => { setSort(o.value); setSortOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%',
                    padding: '8px 11px', border: 'none', background: on ? 'var(--rz-coral-050)' : 'transparent',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'var(--font-sans)', fontSize: 13.5,
                    color: on ? 'var(--rz-coral-700)' : 'var(--rz-gray-700)', fontWeight: on ? 600 : 500,
                  }}
                  onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--rz-gray-100)'; }}
                  onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}
                >
                  {o.label}
                  {on && <Glyph name="check" size={15} style={{ color: 'var(--rz-coral)', flex: 'none' }} />}
                </button>
              );
            })}
          </div>
        </React.Fragment>
      )}
    </div>
  );

  const FiltersBody = (
    <div>
      <FilterSection title="Ordenar por">
        {OrdenarPor}
      </FilterSection>

      <FilterSection title="Tipo de servicio">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {CATS.map((c) => (
            <Checkbox key={c} label={c} checked={cats[c]} onChange={(v) => setCats((s) => ({ ...s, [c]: v }))} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Calificación">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {[{ v: 0, l: 'Todas' }, { v: 4.5, l: '4.5+' }, { v: 4.0, l: '4.0+' }, { v: 3.5, l: '3.5+' }].map((r) => (
            <label key={r.v} onClick={() => setMinRating(r.v)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <Radio checked={minRating === r.v} onChange={() => setMinRating(r.v)} />
              {r.v ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, color: 'var(--rz-gray-700)' }}>
                  <Glyph name="star" size={15} filled style={{ color: 'var(--rz-gold)' }} />{r.l}
                </span>
              ) : <span style={{ fontSize: 15, color: 'var(--rz-gray-700)' }}>{r.l}</span>}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Distancia">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {[{ v: 0, l: 'Cualquier distancia' }, { v: 2, l: 'Hasta 2 km' }, { v: 3.5, l: 'Hasta 3.5 km' }, { v: 5, l: 'Hasta 5 km' }].map((d) => (
            <Radio key={d.v} label={d.l} checked={maxDist === d.v} onChange={() => setMaxDist(d.v)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Rango de precio">
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: 0, l: 'Todos' }, { v: 1, l: '$' }, { v: 2, l: '$$' }, { v: 3, l: '$$$' }].map((p) => (
            <button key={p.v} onClick={() => setPrice(p.v)} style={{
              flex: 1, height: 40, borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
              background: price === p.v ? 'var(--rz-navy)' : 'var(--surface-card)',
              color: price === p.v ? '#fff' : 'var(--rz-gray-700)',
              border: `1.5px solid ${price === p.v ? 'var(--rz-navy)' : 'var(--border-default)'}`,
              transition: 'all var(--dur-base)',
            }}>{p.l}</button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Disponibilidad">
        <Checkbox label="Disponible hoy" checked={availToday} onChange={setAvailToday} />
      </FilterSection>

      <FilterSection title="Promociones" last>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, color: 'var(--rz-gray-700)' }}>
            <Glyph name="sparkles" size={16} style={{ color: 'var(--rz-coral)' }} />Solo con promociones
          </span>
          <Checkbox checked={promosOnly} onChange={setPromosOnly} />
        </label>
      </FilterSection>
    </div>
  );

  const FiltersPanel = (
    <aside className={lock ? 'rz-scroll-thin' : undefined} style={{
      width: 280, flex: 'none',
      ...(lock
        ? { alignSelf: 'stretch', height: '100%', overflowY: 'auto' }
        : { alignSelf: 'flex-start', position: 'sticky', top: 100 }),
      // Integrated, editorial sidebar — flat against the page (no card container,
      // border, radius or shadow). Left edge aligns with the page padding; the
      // column gap + a little right padding separate it from the results list.
      background: 'transparent', border: 'none', borderRadius: 0, boxShadow: 'none',
      padding: '6px 22px 14px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 4px' }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--rz-navy)' }}>Filtros</h3>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--rz-coral)' }}>Limpiar</button>
        )}
      </div>
      {FiltersBody}
    </aside>
  );

  // =================================================================== RESULTS
  const ResultsList = (
    view === 'grid' ? (
      <div style={{
        display: 'grid', rowGap: 26, columnGap: 16,
        // Map visible → wide:3, standard desktop:2, tablet:2, mobile:1.
        // Map hidden  → wide:4, standard desktop:3, tablet:2, mobile:1.
        gridTemplateColumns: `repeat(${
          isMobile ? 1 : isTablet ? 2 : isWide ? (showMap ? 3 : 4) : (showMap ? 2 : 3)
        }, minmax(0,1fr))`,
      }}>
        {results.map((b) => (
          <BusinessResultCard key={b._i} {...b} image={b.img}
            favorite={!!fav[b._i]} onFavorite={() => toggleFav(b._i)}
            onClick={() => onOpenVenue(b)} onReserve={() => onOpenVenue(b)} />
        ))}
      </div>
    ) : (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 16,
        // When the map is hidden on wide desktop, the results column grows by the
        // map's width + gap. Cap the list to exactly the width it had WITH the map
        // (full width − map − gap) so the cards never enlarge OR shrink, then center
        // it so the freed map space becomes balanced breathing room. At every
        // narrower width the map reflows below the list, so the column is already
        // full-width in both states — no cap needed there.
        maxWidth: (isWide && !showMap)
          ? 'calc(100% - clamp(400px, 31vw, 560px) - clamp(32px, 2.6vw, 40px))'
          : 'none',
        marginLeft: (isWide && !showMap) ? 'auto' : 0,
        marginRight: (isWide && !showMap) ? 'auto' : 0,
        width: '100%',
      }}>
        {results.map((b) => (
          <BusinessListItem key={b._i} {...b} image={b.img}
            active={active === b._i}
            onMouseEnter={() => setActive(b._i)}
            favorite={!!fav[b._i]} onFavorite={() => toggleFav(b._i)}
            onClick={() => onOpenVenue(b)} onReserve={() => onOpenVenue(b)} />
        ))}
      </div>
    )
  );

  const EmptyState = (
    <div style={{ textAlign: 'center', padding: '52px 24px', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: '50%', background: 'var(--rz-coral-050)', color: 'var(--rz-coral)', marginBottom: 16 }}>
        <Glyph name="search" size={26} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--rz-navy)', letterSpacing: '-0.3px' }}>Ningún negocio coincide con tu búsqueda</h3>
      <p style={{ fontSize: 15, color: 'var(--rz-gray-500)', marginTop: 8, maxWidth: 380, margin: '8px auto 0', lineHeight: 1.5 }}>Prueba con otro servicio, categoría, ubicación o filtro.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 22 }}>
        <Button variant="primary" onClick={clearFilters}>Borrar filtros</Button>
        <button onClick={showAllBusinesses} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 600, color: 'var(--rz-coral)', padding: '6px 4px' }}>Ver todos los negocios</button>
      </div>
    </div>
  );

  // ---- view + map controls — one grouped segmented control ----
  // Lista | Cuadrícula | Ocultar mapa / Ver mapa — all share the same pill style.
  // Three distinct <button>s (not a shared helper) so the editor tracks each node
  // independently and active states update reliably.
  const segBase = {
    display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px',
    border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
  };
  const seg = (on) => ({ ...segBase, background: on ? 'var(--rz-navy)' : 'transparent', color: on ? '#fff' : 'var(--rz-gray-600)' });

  const ViewMapControls = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: 4, background: 'var(--rz-gray-100)', borderRadius: 'var(--radius-pill)' }}>
      <button onClick={() => setView('list')} style={seg(view === 'list')}>
        <Glyph name="list" size={16} />{!isMobile && 'Lista'}
      </button>
      <button onClick={() => setView('grid')} style={seg(view === 'grid')}>
        <Glyph name="grid" size={16} />{!isMobile && 'Cuadrícula'}
      </button>
      {!isMobile && <span style={{ width: 1, height: 22, background: 'var(--rz-gray-300)', margin: '0 4px', flex: 'none' }} />}
      {!isMobile && (
        <button onClick={showMap ? hideMapGrid : showMapList} style={seg(showMap)}>
          <Glyph name={showMap ? 'close' : 'mapPin'} size={16} />{showMap ? 'Ocultar mapa' : 'Ver mapa'}
        </button>
      )}
    </div>
  );

  const Toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {(isTablet || isMobile) && (
        <Button variant="outline" size="sm" leftIcon="filter" onClick={() => setFiltersOpen(true)}>
          Filtros{activeFilterCount ? ` (${activeFilterCount})` : ''}
        </Button>
      )}
      <span style={{ flex: 1, minWidth: 0 }} />
      {ViewMapControls}
    </div>
  );

  // ---- active filter chips ----
  const ChipRow = (activeFilterCount > 0 || hasQuery) && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
      {hasQuery && <Chip active uppercase={false} icon="close" onClick={() => setQuery('')}>“{query.trim()}”</Chip>}
      {activeCats.map((c) => (
        <Chip key={c} active uppercase={false} icon="close" onClick={() => setCats((s) => ({ ...s, [c]: false }))}>{c}</Chip>
      ))}
      {minRating > 0 && <Chip active uppercase={false} icon="close" onClick={() => setMinRating(0)}>{minRating}+ estrellas</Chip>}
      {maxDist > 0 && <Chip active uppercase={false} icon="close" onClick={() => setMaxDist(0)}>Hasta {maxDist} km</Chip>}
      {price > 0 && <Chip active uppercase={false} icon="close" onClick={() => setPrice(0)}>{['', '$', '$$', '$$$'][price]}</Chip>}
      {availToday && <Chip active uppercase={false} icon="close" onClick={() => setAvailToday(false)}>Disponible hoy</Chip>}
      {promosOnly && <Chip active uppercase={false} icon="close" onClick={() => setPromosOnly(false)}>Promociones</Chip>}
      <button onClick={clearFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--rz-gray-500)', padding: '0 8px' }}>Limpiar todo</button>
    </div>
  );

  // Full-width search workspace: no centered max-width container. The page
  // fills the viewport with safe side padding so filters anchor far left and
  // the map anchors far right.
  const PAGE_PAD = 'clamp(24px, 3vw, 40px)';

  return (
    <div style={{ background: 'var(--rz-gray-050)', minHeight: '100vh' }}>
      {isLoggedIn
        ? <Header logoSrc={logo} notifications user={user} onLogoClick={onHome} sticky contextTitle={pageTitle} contextSubtitle={countLabel} searchService={query} onSearch={(q) => setQuery(readQuery(q))} {...RZ.loggedInHeaderProps({ onAccount, onFavorites, onLogout })} />
        : <Header variant="home" logoSrc={logo} onLogoClick={onHome} sticky onLogin={onLogin} onJoinBusiness={onJoinBusiness} contextTitle={pageTitle} contextSubtitle={countLabel} searchService={query} onSearch={(q) => setQuery(readQuery(q))} />}

      {/* Dynamic results title now lives inside the header (contextTitle /
          contextSubtitle), next to the search bar — no separate page section. */}


      {/* Body — near full-width, safe side padding (no centered container) */}
      <div style={{ width: '100%', padding: `24px ${PAGE_PAD} ${lock ? 24 : 56}px` }}>
        <div style={{
          display: 'flex', gap: 'clamp(32px, 2.6vw, 40px)',
          alignItems: lock ? 'stretch' : 'flex-start',
          ...(lock ? { height: `calc(100vh - ${LOCK_OFFSET}px)` } : null),
        }}>
          {isDesktop && FiltersPanel}

          {/* Results column — when locked, the toolbar is a fixed header of the
              column and the list scrolls in its own area below it, so cards
              clip at the toolbar's bottom edge and never pass behind it. */}
          <main style={{
            flex: 1, minWidth: 0,
            ...(lock ? { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 } : null),
          }}>
            {lock ? (
              <React.Fragment>
                <div ref={toolbarRef} style={{
                  flex: 'none', background: 'var(--rz-gray-050)', padding: '6px 0 14px',
                  boxShadow: '0 8px 14px -14px rgba(2,48,71,0.16)',
                }}>{Toolbar}</div>
                <div className="rz-scroll-thin" style={{
                  flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
                  padding: '8px 10px 24px 4px', margin: '0 -10px 0 -4px',
                }}>
                  {results.length ? ResultsList : EmptyState}
                </div>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div ref={stickySentinelRef} style={{ height: 0 }} />
                <div ref={toolbarRef} style={{
                  position: 'sticky', top: 84, zIndex: 20, background: 'var(--rz-gray-050)',
                  padding: '6px 0 16px', marginBottom: 4,
                  boxShadow: stuck ? '0 1px 0 var(--border-subtle), 0 10px 18px -12px rgba(2,48,71,0.22)' : 'none',
                  transition: 'box-shadow 0.18s ease',
                }}>{Toolbar}</div>
                {results.length ? ResultsList : EmptyState}
              </React.Fragment>
            )}
          </main>

          {/* Map column (wide desktop) — controls bar above, map fills the rest */}
          {isWide && showMap && (
            <div style={{
              flex: 'none', width: 'clamp(400px, 31vw, 560px)',
              ...(lock
                ? { height: '100%', display: 'flex', flexDirection: 'column' }
                : { alignSelf: 'flex-start', position: 'sticky', top: 84 }),
            }}>
              {/* Spacer matched to the measured toolbar height so the map top
                 lines up with the first business card. The map toggle now lives
                 in the results toolbar, grouped with Lista / Cuadrícula. */}
              <div style={{ height: toolbarH || 64, padding: '6px 0 16px', marginBottom: lock ? 0 : 4, flex: 'none' }} />
              <div style={{
                ...(lock ? { flex: 1, minHeight: 0 } : { height: 'calc(100vh - 164px)', minHeight: 560 }),
                borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)',
              }}>
                <ResultsMap results={results} active={active} setActive={setActive} onOpenVenue={onOpenVenue} mapPos={MAP_POS} />
              </div>
            </div>
          )}
        </div>

        {/* Map (below results) — wide desktop shows it on the right; every
           narrower width (smaller desktop, tablet, mobile) reflows it here. */}
        {!isWide && showMap && (
          <div style={{ marginTop: 20, height: 480, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            <ResultsMap results={results} active={active} setActive={setActive} onOpenVenue={onOpenVenue} mapPos={MAP_POS} anchored={false} />
          </div>
        )}
      </div>

      {/* Mobile map FAB */}
      {isMobile && (
        <button onClick={() => (showMap ? hideMapGrid() : showMapList())} style={{
          position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 70,
          display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, padding: '0 22px',
          border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
          background: 'var(--rz-navy)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
          boxShadow: '0 10px 26px rgba(2,48,71,0.28)',
        }}>
          <Glyph name={showMap ? 'list' : 'mapPin'} size={18} />{showMap ? 'Ver lista' : 'Ver mapa'}
        </button>
      )}

      {/* Filters bottom sheet (tablet/mobile) */}
      {!isDesktop && filtersOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setFiltersOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(2,30,44,0.45)', backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'relative', background: 'var(--surface-card)', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '86vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-modal)' }}>
            <div style={{ padding: '14px 22px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 44, height: 5, borderRadius: 999, background: 'var(--rz-gray-200)', margin: '0 auto 12px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--rz-navy)' }}>Filtros</h3>
                <IconButton icon="close" variant="ghost" round label="Cerrar" onClick={() => setFiltersOpen(false)} />
              </div>
            </div>
            <div style={{ overflowY: 'auto', padding: '0 22px' }}>{FiltersBody}</div>
            <div style={{ display: 'flex', gap: 12, padding: '14px 22px', borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="ghost" fullWidth onClick={clearFilters}>Limpiar</Button>
              <Button variant="primary" fullWidth onClick={() => setFiltersOpen(false)}>Ver {results.length} negocios</Button>
            </div>
          </div>
        </div>
      )}

      <Footer logoSrc={logoW} columns={RZ.footerColumns} socials={['instagram', 'facebook', 'linkedin', 'x']} contentMax="min(94vw, 1600px)" />
    </div>
  );
}
window.SearchResults = SearchResults;
