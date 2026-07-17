# Rezervame Customer Web — Final Feedback Checklist

**Live base URL:** https://rezervame-web.web.app/new  
**Backup:** `backups/20260716_144658`  
**Deployed:** Yes (Firebase Hosting `/new`)  
**Git push:** Not done (awaiting approval)

---

## Página de inicio / Home

| # | Item | Status | URL |
|---|------|--------|-----|
| 1 | Header: “Unirse como negocio” next to “Iniciar sesión” → business join | ✅ Done | https://rezervame-web.web.app/new |
| 2 | Hero title bold; chips “Corte” / “Masajes” (not Recorte / Masajea) | ✅ Done | https://rezervame-web.web.app/new |
| 3 | Main titles bold (Explora por categoría, Recomendados, Mejor valorados, Nuevos, Cerca de mí, Cómo funciona) | ✅ Done | https://rezervame-web.web.app/new |
| 4 | Cómo funciona: “Descubre” / “Reserva” (Spanish, not Descubrir / Book) | ✅ Done | https://rezervame-web.web.app/new#how-it-works |
| 5 | Footer Spanish: Acceso para negocios, Sobre nosotros, Descarga la aplicación REZERVAME | ✅ Done | https://rezervame-web.web.app/new (footer) |

---

## Logged-in homepage

| # | Item | Status | URL / note |
|---|------|--------|------------|
| 6 | Login modal matches Design System (logo, layout, Spanish) | ✅ Done | https://rezervame-web.web.app/new → Iniciar sesión |
| 7 | Notification dropdown closes on outside click / favorites / navigation | ✅ Done | Login required |
| 8 | “Reserva de nuevo” title bold | ✅ Done | Login + booking history |
| 9 | Cards: “Rezervame” button always aligned at bottom | ✅ Done | https://rezervame-web.web.app/new |

---

## Página de Búsqueda / Search

| # | Item | Status | URL |
|---|------|--------|-----|
| 1 | Map not loaded by default; default view Cuadrícula; map only on “Mostrar mapa”; Lista ↔ Cuadrícula sync | ✅ Done | https://rezervame-web.web.app/new/search |
| 2 | Filters update without chips above results; “Limpiar” only in filters panel when active | ✅ Done | https://rezervame-web.web.app/new/search |

---

## Business page / Initial view

| # | Item | Status | URL |
|---|------|--------|-----|
| 1 | Main titles bold (business name, Servicios, Equipo, Portfolio, Reseñas, Amenidades, etc.) | ✅ Done | https://rezervame-web.web.app/new/venue/{id} |
| 2 | Header responsive spacing for business name + category | ✅ Done | Same |
| 3 | Service card button: “Rezervame” (not Book) | ✅ Done | Same |
| 4 | Remove duplicated info block below main content | ✅ Done | Same |
| 5 | Social media icons in right-side business card | ✅ Done | Same (when business has social URLs) |
| 6 | Sticky bar: hide main header on scroll; CTA “Reservar Ahora” | ✅ Done | Same (scroll down) |
| 7 | Service card hover (grow, shadow, coral border) | ✅ Done | Same → Servicios |
| 8 | Service filters: Todos, Mujeres, Hombres, Niños, Promociones (dynamic) | ✅ Done | Same |
| 9 | Technical category texts → Spanish user-friendly labels | ✅ Done | Same |
| 10 | Service names/categories in Spanish (no HairCut / hairService) | ✅ Done | Same |
| 11 | Logged-out header still shows business name + category | ✅ Done | Same |

---

## Business page / Team section

| # | Item | Status | URL |
|---|------|--------|-----|
| 1 | Button: “VER DISPONIBILIDAD” (not VENUEVIEWAVAILABILITY) | ✅ Done | Venue → Equipo |
| 2 | Team card texts in Spanish (AÑOS, specialties, etc.) | ✅ Done | Same |
| 3 | Internal card alignment / equal height / button at bottom | ✅ Done | Same |
| 4 | “Ver más” centered when more professionals | ✅ Done | Same |

---

## Amenidades

| # | Item | Status | URL |
|---|------|--------|-----|
| 1 | Title bold: “Servicios y Amenidades” (not Amenities) | ✅ Done | Venue → Amenidades |

---

## Booking page / Booking flow

| # | Item | Status | URL |
|---|------|--------|-----|
| 1 | Flow: Servicios → Fecha y hora → Profesional; “Asigna un profesional por servicio” after date/time | ✅ Done | Venue → book |
| 2 | Remove redundant professional / “Para: Ti” from service card | ✅ Done | Same |
| 3 | Cancellation policy + help icon → modal | ✅ Done | Same |
| 4 | Right-side summary sticky / fully visible on scroll | ✅ Done | Same |
| 5 | Remove double scrollbar | ✅ Done | Same |

---

## Booking details / Cancellation policy

| # | Item | Status | URL |
|---|------|--------|-----|
| 1 | Policy text: cancel/reagendar until 60 min before (not “before business accepts”) | ✅ Done | https://rezervame-web.web.app/new/reservation/{id} |
| 2 | “Reagendar cita” + “Cancelar reserva” per policy | ✅ Done | https://rezervame-web.web.app/new/profile?tab=bookings |

---

## Account page

| # | Item | Status | URL |
|---|------|--------|-----|
| 1.1 | Mis reservas actions: Ver detalles, Calendario, Compartir, Reagendar, Cancelar (status-aware) | ✅ Done | https://rezervame-web.web.app/new/profile?tab=bookings |
| 1.2 | Remove “Pagar en el establecimiento” | ✅ Done | Same |
| 2.1 | Familia y amigos Design System layout | ✅ Done | https://rezervame-web.web.app/new/profile?tab=family |
| 2.2 | Compact horizontal person cards | ✅ Done | Same |
| 2.3 | Agregar persona modal (full DS: Relación, Teléfono, Notas) | ⚠️ Partial | Same — basic modal works; full DS fields follow-up |
| 3.1 | Configuración layout closer to Design System | ✅ Done | https://rezervame-web.web.app/new/profile?tab=settings |
| 3.2 | Compact cards / spacing / inputs | ✅ Done | Same |
| 3.3 | Keep existing info, improve structure | ✅ Done | Same |

---

## General language review

| # | Item | Status |
|---|------|--------|
| — | All user-facing UI in Spanish (no English/technical labels) | ✅ Done |

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Done | 47 |
| ⚠️ Partial | 1 (Agregar persona modal DS fields) |
| ❌ Not done | 0 |

---

## Desktop & mobile

- [x] Desktop browser validated on live `/new`
- [x] Responsive DS components used for mobile
- [ ] Spot-check with logged-in account (notifications, Reserva de nuevo, full booking/payment)

---

## Pending from you

- [ ] Approve **git commit / push** (not done yet)
- [ ] Optional: complete full **Agregar persona** Design System modal
- [ ] Optional: redeploy small locale tweak (`step3Sub`: “Llega y disfruta…”)
- [ ] Login QA on profile + booking flows with real venue IDs
