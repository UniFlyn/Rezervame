/* Shared demo data for the Rezervame customer-web UI kit. */
window.RZ = window.RZ || {};
const U = (id, w, h) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=72`;

window.RZ.img = {
  salon: U('1560066984-138dadb4c035', 1400, 720),
  hero: U('1570172619644-dfd03ed5d881', 1680, 820),
  salon2: U('1521590832167-7bcbfaa6381f', 800, 600),
  map: U('1524661135-423995f22d0b', 700, 500),
  avatar: U('1500648767791-00dcc994a43e', 120, 120),
  hair: [
    U('1562322140-8baeececf3df', 360, 460),
    U('1503951914875-452162b0f3f1', 360, 460),
    U('1605497788044-5a32c7078486', 360, 520),
    U('1599351431202-1e0f0137899a', 360, 420),
    U('1622286342621-4bd786c2447c', 360, 480),
    U('1492106087820-71f1a00d2b11', 360, 440),
    U('1595476108010-b4d1f102b1b1', 360, 560),
    U('1487412947147-5cebf100ffc2', 360, 460),
  ],
  staff: [
    U('1633332755192-727a05c4013d', 360, 360),
    U('1507003211169-0a1dd7228f2d', 360, 360),
    U('1531123897727-8f129e1688ce', 360, 360),
    U('1494790108377-be9c29b29330', 360, 360),
    U('1472099645785-5658abf4ff4e', 360, 360),
    U('1438761681033-6461ffad8d80', 360, 360),
    U('1506794778202-cad84cf45f1d', 360, 360),
    U('1544005313-94ddf0286df2', 360, 360),
  ],
  cats: [
    U('1521590832167-7bcbfaa6381f', 400, 280),
    U('1570172619644-dfd03ed5d881', 400, 280),
    U('1487412947147-5cebf100ffc2', 400, 280),
    U('1633681926022-84c23e8cb2d6', 400, 280),
    U('1604654894610-df63bc536371', 400, 280),
    U('1599351431202-1e0f0137899a', 400, 280),
    U('1487412720507-e7ab37603c6f', 400, 280),
  ],
};

window.RZ.user = { name: 'Richard Lucas', email: 'richard@correo.com', reservations: 152, avatar: window.RZ.img.avatar };

/* Businesses this customer recently visited / booked — drives the logged-in
   "Reserva de nuevo" Home section. Empty array → section is hidden. */
window.RZ.recentlyViewed = [0, 3, 2, 5];

window.RZ.services = [
  { name: 'Corte de cabello para mujer', description: 'Corte y peinado profesional adaptado a tus preferencias', duration: '60 min', price: 65, audience: ['mujeres'] },
  { name: 'Corte de cabello para hombre', description: 'Corte clásico o moderno, realizado con precisión y estilo', duration: '45 min', price: 35, audience: ['hombres'] },
  { name: 'Corte de cabello para niño', description: 'Corte divertido y cómodo, pensado para los más pequeños', duration: '30 min', price: 25, audience: ['ninos'] },
  { name: 'Corte y peinado para niña', description: 'Corte, lavado y peinado suave ideal para niñas', duration: '40 min', price: 30, audience: ['ninos'] },
  { name: 'Coloración de cabello', description: 'Servicio completo de color con productos de alta gama', duration: '3-4 horas', price: 120, audience: ['mujeres', 'hombres'] },
  { name: 'Highlights', description: 'Reflejos parciales o completos para aportar dimensión y profundidad', duration: '2-3 horas', price: 140, audience: ['mujeres'] },
  { name: 'Balayage', description: 'Reflejos aplicados a mano para un efecto natural y luminoso', duration: '3-5 horas', price: 180, audience: ['mujeres'], promo: true, oldPrice: 200 },
  { name: 'Secado de Cabello (Blower)', description: 'Lavado profesional y peinado con secado tipo salón', duration: '45 min', price: 45, audience: ['mujeres'], promo: true, oldPrice: 55 },
  { name: 'Tratamiento de Keratina', description: 'Tratamiento alisador para un cabello suave, sin frizz y con brillo', duration: '3-4 horas', price: 250, audience: ['mujeres', 'hombres'] },
];

window.RZ.team = [
  { name: 'Mateo Ríos', role: 'Barbero & Grooming Expert', rating: 4.9, reviews: 128, bio: 'Especialista en cortes clásicos, fades modernos y afeitados con toalla caliente.', stats: [{icon:'user',value:'250+',label:'Clientes'},{icon:'checkCircle',value:'6+',label:'Años'},{icon:'star',value:'4.9',label:'Puntaje'},{icon:'sparkles',value:'90+',label:'Reseñas'}] },
  { name: 'Diego Mendoza', role: 'Estilista & Colorista', rating: 5.0, reviews: 156, bio: 'Experto en balayage, highlights y transformaciones de color únicas.', stats: [{icon:'user',value:'320+',label:'Clientes'},{icon:'checkCircle',value:'8+',label:'Años'},{icon:'star',value:'5.0',label:'Puntaje'},{icon:'sparkles',value:'120+',label:'Reseñas'}] },
  { name: 'Sofía Herrera', role: 'Estilista & Colorista', rating: 4.8, reviews: 94, bio: 'Especialista en color, balayage y peinados de evento con sello propio.', stats: [{icon:'user',value:'180+',label:'Clientes'},{icon:'checkCircle',value:'5+',label:'Años'},{icon:'star',value:'4.8',label:'Puntaje'},{icon:'sparkles',value:'75+',label:'Reseñas'}] },
  { name: 'Camila Vega', role: 'Estilista & Tratamientos', rating: 4.9, reviews: 112, bio: 'Enfocada en tratamientos capilares premium, keratina y cuidado profundo.', stats: [{icon:'user',value:'210+',label:'Clientes'},{icon:'checkCircle',value:'7+',label:'Años'},{icon:'star',value:'4.9',label:'Puntaje'},{icon:'sparkles',value:'85+',label:'Reseñas'}] },
  { name: 'Lucas Moreno', role: 'Barbero & Afeitado', rating: 4.7, reviews: 88, bio: 'Cortes de precisión, diseño de barba y afeitados clásicos con toalla caliente.', stats: [{icon:'user',value:'160+',label:'Clientes'},{icon:'checkCircle',value:'4+',label:'Años'},{icon:'star',value:'4.7',label:'Puntaje'},{icon:'sparkles',value:'60+',label:'Reseñas'}] },
  { name: 'Valentina Cruz', role: 'Colorista Senior', rating: 5.0, reviews: 134, bio: 'Especialista en color de fantasía, balayage y correcciones de color.', stats: [{icon:'user',value:'290+',label:'Clientes'},{icon:'checkCircle',value:'9+',label:'Años'},{icon:'star',value:'5.0',label:'Puntaje'},{icon:'sparkles',value:'110+',label:'Reseñas'}] },
  { name: 'Andrés Pinto', role: 'Estilista & Peinados', rating: 4.8, reviews: 76, bio: 'Peinados de evento, recogidos y acabados de pasarela para ocasiones especiales.', stats: [{icon:'user',value:'140+',label:'Clientes'},{icon:'checkCircle',value:'5+',label:'Años'},{icon:'star',value:'4.8',label:'Puntaje'},{icon:'sparkles',value:'58+',label:'Reseñas'}] },
  { name: 'Isabella Ramos', role: 'Tratamientos Capilares', rating: 4.9, reviews: 101, bio: 'Experta en keratina, botox capilar y rituales de hidratación profunda.', stats: [{icon:'user',value:'200+',label:'Clientes'},{icon:'checkCircle',value:'6+',label:'Años'},{icon:'star',value:'4.9',label:'Puntaje'},{icon:'sparkles',value:'80+',label:'Reseñas'}] },
];

/* Portfolio gallery — real work samples with a category tag so the filter chips
   actually narrow the set. Varied source heights drive the masonry rhythm. */
window.RZ.portfolio = [
  { src: U('1562322140-8baeececf3df', 600, 800), cat: 'Cabello', alt: 'Corte y peinado en ondas' },
  { src: U('1521590832167-7bcbfaa6381f', 600, 520), cat: 'Color', alt: 'Coloración rubia' },
  { src: U('1503951914875-452162b0f3f1', 600, 760), cat: 'Barbería', alt: 'Corte clásico de caballero' },
  { src: U('1604654894610-df63bc536371', 600, 600), cat: 'Uñas', alt: 'Manicure profesional' },
  { src: U('1605497788044-5a32c7078486', 600, 760), cat: 'Color', alt: 'Balayage natural' },
  { src: U('1599351431202-1e0f0137899a', 600, 560), cat: 'Barbería', alt: 'Diseño de barba' },
  { src: U('1522337660859-02fbefca4702', 600, 800), cat: 'Cabello', alt: 'Peinado de evento' },
  { src: U('1632345031435-8727f6897d53', 600, 540), cat: 'Uñas', alt: 'Uñas con arte' },
  { src: U('1487412947147-5cebf100ffc2', 600, 720), cat: 'Cabello', alt: 'Melena con volumen' },
  { src: U('1595476108010-b4d1f102b1b1', 600, 600), cat: 'Color', alt: 'Reflejos de color' },
  { src: U('1585747860715-2ba37e788b70', 600, 780), cat: 'Barbería', alt: 'Fade moderno' },
  { src: U('1610992015732-2449b76344bc', 600, 560), cat: 'Uñas', alt: 'Esmaltado en gel' },
  { src: U('1492106087820-71f1a00d2b11', 600, 760), cat: 'Cabello', alt: 'Corte en capas' },
  { src: U('1633681926022-84c23e8cb2d6', 600, 600), cat: 'Color', alt: 'Color completo' },
  { src: U('1599387737838-626d8b8a2b1f', 600, 540), cat: 'Barbería', alt: 'Afeitado con navaja' },
  { src: U('1519014816548-bf5fe059798b', 600, 780), cat: 'Cabello', alt: 'Acabado de salón' },
  { src: U('1633332755192-727a05c4013d', 600, 600), cat: 'Barbería', alt: 'Grooming de barba' },
  { src: U('1457972729786-0411a3b2b626', 600, 740), cat: 'Cabello', alt: 'Estilo recogido' },
];

window.RZ.categories = [
  { title: 'Servicios para el cabello', img: window.RZ.img.cats[0] },
  { title: 'Spa y bienestar', img: window.RZ.img.cats[1] },
  { title: 'Servicios de belleza', img: window.RZ.img.cats[2] },
  { title: 'Depilación', img: window.RZ.img.cats[3] },
  { title: 'Cuidado de las uñas', img: window.RZ.img.cats[4] },
  { title: 'Barbería', img: window.RZ.img.cats[5] },
  { title: 'Maquillaje', img: window.RZ.img.cats[6] },
];

window.RZ.businesses = [
  { name: 'Luxe Hair Studio', img: window.RZ.img.salon, rating: 4.9, reviews: 287, category: 'Cabello', location: 'Av. Balboa', distance: '2.3 km', services: ['Corte de cabello', 'Coloración', 'Balayage', 'Keratina'], hoursToday: '09:00 AM – 06:00 PM', priceFrom: 35, priceTo: 180, badge: 'Nuevo' },
  { name: 'Nail Society Soho', img: window.RZ.img.cats[4], rating: 4.8, reviews: 142, category: 'Uñas', location: 'Costa del Este', distance: '4.1 km', services: ['Manicure', 'Pedicure', 'Uñas acrílicas'], hoursToday: '10:00 AM – 07:00 PM', priceFrom: 25, priceTo: 60 },
  { name: 'Spa Wellness Center', img: window.RZ.img.cats[1], rating: 4.7, reviews: 203, category: 'Spa', location: 'Punta Pacífica', distance: '3.0 km', services: ['Masaje relajante', 'Facial', 'Aromaterapia'], hoursToday: '09:00 AM – 08:00 PM', priceFrom: 60, priceTo: 150 },
  { name: 'The Grooming Room', img: window.RZ.img.cats[5], rating: 4.9, reviews: 98, category: 'Barbería', location: 'San Francisco', distance: '1.8 km', services: ['Corte clásico', 'Fade', 'Afeitado', 'Barba'], hoursToday: '08:00 AM – 07:00 PM', priceFrom: 20, priceTo: 55, badge: 'Verificado' },
  { name: 'Glow Beauty Bar', img: window.RZ.img.cats[2], rating: 4.8, reviews: 176, category: 'Belleza', location: 'Marbella', distance: '2.6 km', services: ['Maquillaje', 'Cejas', 'Pestañas'], hoursToday: '10:00 AM – 06:00 PM', priceFrom: 40, priceTo: 120 },
  { name: 'Studio Blush', img: window.RZ.img.cats[0], rating: 5.0, reviews: 64, category: 'Cabello', location: 'El Cangrejo', distance: '1.2 km', services: ['Corte de cabello', 'Highlights', 'Balayage'], hoursToday: '09:00 AM – 06:00 PM', priceFrom: 45, priceTo: 160, badge: 'Nuevo' },
  { name: 'Serenity Spa & Lounge', img: window.RZ.img.hair[4], rating: 4.9, reviews: 231, category: 'Spa', location: 'Obarrio', distance: '3.4 km', services: ['Masaje', 'Facial premium', 'Sauna'], hoursToday: '09:00 AM – 09:00 PM', priceFrom: 70, priceTo: 200 },
  { name: 'Bella Piel Estética', img: window.RZ.img.cats[3], rating: 4.6, reviews: 119, category: 'Depilación', location: 'Bella Vista', distance: '2.0 km', services: ['Cera', 'Depilación láser', 'Cejas'], hoursToday: '09:00 AM – 05:00 PM', priceFrom: 30, priceTo: 90 },
];

/* Curated Home sections — each is its OWN stacked section (not a tab/filter). */
window.RZ.homeSections = [
  { title: 'Recomendados para ti', subtitle: 'Elegidos según tus gustos', items: [0, 5, 2, 6, 4, 3] },
  { title: 'Mejor valorados', subtitle: 'Los favoritos de Panamá', items: [5, 0, 3, 6, 1, 2] },
  { title: 'Nuevos en Rezervame', subtitle: 'Recién llegados a la plataforma', items: [0, 5, 7, 4, 2, 1] },
  { title: 'Cerca de mí', subtitle: 'En tu zona', items: [4, 1, 3, 7, 6, 0] },
];

/* Shared logged-in customer header wiring — notifications panel + account menu.
   Used by EVERY page that renders the logged-in customer header (Home,
   SearchResults, Venue, Booking, Checkout, Account) so the dropdowns stay
   identical everywhere. Pass the page's navigation handlers; returns the
   Header props that drive the bell panel + avatar menu. Spread the result
   onto <Header>. */
window.RZ.loggedInHeaderProps = function ({ onAccount, onFavorites, onLogout } = {}) {
  const acct = onAccount || (() => {});
  const favs = onFavorites || (() => {});
  const logout = onLogout || (() => {});
  // Live notification store published by App (index.html). Falls back to the
  // static seed data so the header still renders if App hasn't mounted yet.
  const store = window.RZ._notif || {};
  const source = store.items || (RZ.account ? RZ.account.notifications : []) || [];
  const preview = source.slice(0, 4).map((n) => ({
    icon: n.icon, title: n.title, time: n.time, unread: n.unread,
    onClick: () => (store.onItemClick ? store.onItemClick(n) : acct()),
  }));
  return {
    onFavorites: favs,
    onSeeAllNotifications: store.onSeeAll || acct,
    onMarkAllRead: store.onMarkAllRead || null,
    accountMenu: [
      { label: 'Mi cuenta', icon: 'user', onClick: acct },
      { label: 'Mis reservas', icon: 'calendar', onClick: acct },
      { label: 'Favoritos', icon: 'heart', onClick: favs },
      { label: 'Métodos de pago', icon: 'creditCard', onClick: acct },
      { label: 'Centro de ayuda', icon: 'helpCircle', divider: true, onClick: acct },
      { label: 'Configuración', icon: 'settings', onClick: acct },
      { label: 'Cerrar sesión', icon: 'logOut', danger: true, divider: true, onClick: logout },
    ],
    notificationItems: preview,
  };
};

window.RZ.footerColumns = [
  { title: 'Para Clientes', links: ['Descargar app', 'Cómo funciona', 'Atención al cliente', 'Reseñas de Rezervame'] },
  { title: 'Para Negocios', links: ['Únete a Rezervame', 'Acceso para Negocios', 'Precios', 'Soporte para Negocios'] },
  { title: 'Rezervame', links: ['Sobre nosotros', 'Empleos', 'Política de privacidad', 'Términos del servicio'] },
];
