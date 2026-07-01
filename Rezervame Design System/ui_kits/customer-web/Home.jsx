/* Home / discovery screen — Fresha-style vertically stacked sections.
   No tabs/filter chips: each content group is its own section with a horizontal
   card carousel and a "Ver todos los negocios →" link top-right. */
function Home({ onOpenVenue, onSearch, onJoinBusiness, onLogin, onLogout, onAccount, onFavorites, onViewHistory, isLoggedIn, user, favorites = {}, onToggleFav }) {
  const DS = window.RezervameDesignSystem_4317c4;
  const { Header, Footer, SearchBar, Button, BusinessCard, CategoryCard, CarouselSection, HowItWorks } = DS;
  const RZ = window.RZ;
  const logo = '../../assets/logos/rezervame-color.png';
  const logoW = '../../assets/logos/rezervame-white.png';
  const toggleFav = onToggleFav || (() => {});
  const search = onSearch || (() => {});
  // Read the typed query. New SearchBar passes {service,location}; if the (older,
  // cached) bundle passes a click event, fall back to reading the header input.
  const readQuery = (q) => {
    if (q && typeof q.service === 'string') return { query: q.service, location: q.location || '' };
    const root = (q && q.currentTarget && q.currentTarget.closest && q.currentTarget.closest('header')) || document.querySelector('header');
    const inputs = root ? root.querySelectorAll('input') : [];
    return { query: inputs[0] ? inputs[0].value.trim() : '', location: inputs[1] ? inputs[1].value.trim() : '' };
  };
  // map Home labels → SearchResults category buckets
  const catFor = (label) => ({
    'Servicios para el cabello': 'Cabello', 'Spa y bienestar': 'Spa', 'Servicios de belleza': 'Belleza',
    'Depilación': 'Depilación', 'Cuidado de las uñas': 'Uñas', 'Barbería': 'Barbería', 'Maquillaje': 'Belleza',
    'Corte': 'Cabello', 'Uñas': 'Uñas', 'Masajes': 'Spa', 'Facial': 'Spa', 'Cejas': 'Belleza',
  })[label] || null;

  // Logged-in header actions — account menu + notifications panel. Shared
  // builder (RZ.loggedInHeaderProps) keeps the dropdowns identical across every
  // page that uses the logged-in customer header.
  const acct = onAccount || (() => {});
  const favs = onFavorites || (() => {});
  const loggedInHeader = RZ.loggedInHeaderProps({ onAccount: acct, onFavorites: favs, onLogout });
  // "Reserva de nuevo" — businesses this user recently visited / booked. Section only
  // renders when there is history; an empty list keeps the normal Home layout.
  const recent = (isLoggedIn && Array.isArray(RZ.recentlyViewed)) ? RZ.recentlyViewed : [];

  return (
    <div style={{ background: 'var(--surface-card)' }}>
      {isLoggedIn
        ? <Header logoSrc={logo} sticky user={user} onLogoClick={() => {}} onSearch={(q) => search(readQuery(q))} {...loggedInHeader} />
        : <Header variant="home" logoSrc={logo} sticky onLogin={onLogin} onJoinBusiness={onJoinBusiness} onSearch={(q) => search(readQuery(q))} />}

      {/* Hero — centered & wide over the brand banner image. No search bar (it lives in the header). */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img src="assets/hero-banner.png" alt="" style={{ width: '100%', height: 540, objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(2,18,28,0.24) 0%, rgba(2,18,28,0.32) 55%, rgba(2,18,28,0.44) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
          <div style={{ width: '100%', maxWidth: 1120, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h1 style={{ color: '#fff', fontSize: 50, lineHeight: 1.14, letterSpacing: '-0.8px', maxWidth: 1000, textWrap: 'balance', textShadow: '0 2px 22px rgba(2,18,28,0.45)' }}>
              Reserva tu momento de belleza y bienestar en segundos.
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: 18, lineHeight: 1.55, marginTop: 26, maxWidth: 760, textShadow: '0 1px 14px rgba(2,18,28,0.4)' }}>
              Encuentra salones, spas y expertos cerca de ti, compara opciones y agenda tu cita fácilmente.
            </p>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.4px', marginTop: 54, textShadow: '0 1px 12px rgba(2,18,28,0.4)' }}>
              Servicios destacados
            </p>
            <div style={{ display: 'flex', gap: 20, marginTop: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Corte', 'Uñas', 'Masajes', 'Facial', 'Cejas', 'Maquillaje'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => search({ category: catFor(c), title: c })}
                  style={{
                    width: 132, padding: '11px 0', borderRadius: 12, textAlign: 'center',
                    background: 'rgba(2,18,28,0.30)', border: '1px solid rgba(255,255,255,0.40)',
                    color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 600,
                    cursor: 'pointer', backdropFilter: 'blur(6px)',
                    transition: 'background var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.color = 'var(--rz-navy)'; e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(2,18,28,0.30)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.40)'; e.currentTarget.style.transform = 'none'; }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(0.97)'; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                >{c}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories — widescreen band, centered header, no arrows, still swipeable */}
      <div style={{ width: 'min(94vw, 1600px)', margin: '0 auto', padding: '52px 0 0' }}>
        <CarouselSection title="Explora por categoría" subtitle="Descubre el servicio perfecto para ti" align="center" arrows={false} cardWidth={224} gap={18}>
          {RZ.categories.map((c, i) => (
            <CategoryCard key={i} image={c.img} title={c.title} onClick={() => search({ category: catFor(c.title), title: c.title })} />
          ))}
        </CarouselSection>
      </div>

      <div style={{ width: 'min(94vw, 1600px)', margin: '0 auto', padding: 'clamp(40px, 5vw, 72px) 0 8px', display: 'flex', flexDirection: 'column', gap: 72 }}>
        {RZ.homeSections.map((sec, si) => {
          const promoted = si === 0; // "Recomendados para ti" — priority / promoted businesses
          const sectionEl = (
            <CarouselSection
              key={`sec-${si}`}
              title={sec.title}
              linkLabel="Ver todos los negocios"
              onLink={() => search({ title: sec.title, subtitle: sec.subtitle })}
              cardWidth={336}
              gap={18}
            >
              {sec.items.map((bi) => {
                const b = RZ.businesses[bi];
                return (
                  <BusinessCard
                    key={`${si}-${bi}`}
                    {...b}
                    image={b.img}
                    badge={promoted ? 'Destacado' : undefined}
                    badgeTone="coral"
                    favorite={!!favorites[bi]}
                    onFavorite={() => toggleFav(bi)}
                    onClick={() => onOpenVenue(b)}
                    onReserve={() => onOpenVenue(b)}
                  />
                );
              })}
            </CarouselSection>
          );

          // After the first (promoted) section, slot in the personalized
          // "Reserva de nuevo" row — logged-in only, shown when the user has history.
          if (promoted && recent.length > 0) {
            return (
              <React.Fragment key={`grp-${si}`}>
                {sectionEl}
                <CarouselSection
                  title="Reserva de nuevo"
                  subtitle="Negocios que visitaste recientemente"
                  linkLabel="Ver historial"
                  onLink={onViewHistory || acct}
                  cardWidth={336}
                  gap={18}
                >
                  {recent.map((bi) => {
                    const b = RZ.businesses[bi];
                    return (
                      <BusinessCard
                        key={`recent-${bi}`}
                        {...b}
                        image={b.img}
                        favorite={!!favorites[bi]}
                        onFavorite={() => toggleFav(bi)}
                        onClick={() => onOpenVenue(b)}
                        onReserve={() => onOpenVenue(b)}
                      />
                    );
                  })}
                </CarouselSection>
              </React.Fragment>
            );
          }
          return sectionEl;
        })}
      </div>

      {/* How Rezervame works — soft gray band, final explanatory section before footer */}
      <div style={{ marginTop: 56 }}>
        <HowItWorks variant="soft" contentMax="min(94vw, 1600px)" />
      </div>

      <Footer logoSrc={logoW} columns={RZ.footerColumns} socials={['instagram', 'facebook', 'linkedin', 'x']} contentMax="min(94vw, 1600px)" />
    </div>
  );
}
window.Home = Home;
