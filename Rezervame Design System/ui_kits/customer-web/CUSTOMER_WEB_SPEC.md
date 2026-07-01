# Rezervame — Customer Web Specification

> Developer reference for the customer-facing Rezervame web experience: page structure, user flows, business logic, and Design System usage. Pair this with `README.md` (kit overview) and `COMPONENT_AUDIT.md` (component inventory + audit).

---

## 1. Product overview

Rezervame is a **beauty & wellness booking platform**. Customers can:

- Search for salons, spas, barbershops, beauty professionals and wellness businesses.
- Compare businesses by rating, distance, price and services.
- View a business's services, team, portfolio, reviews and amenities.
- Select a professional, pick a date/time, and book one or several services.
- Pay online (card or Yappy) with funds held until the service is completed.
- Manage reservations, invoices, favourites, saved people and settings from their account.

The customer web is a **high-fidelity prototype** built entirely from the Rezervame Design System primitives. It is a design reference, not production code.

---

## 2. Customer Web scope

The kit lives in `ui_kits/customer-web/`. `index.html` composes the screens and a floating switcher moves between them.

| Area | File | Switcher id |
|------|------|-------------|
| Home / discovery | `Home.jsx` | `home` |
| Search / results | `SearchResults.jsx` | `search` |
| Business detail | `VenuePage.jsx` | `venue` |
| Booking flow | `Booking.jsx` | `booking` |
| Payment | `Checkout.jsx` | `checkout` |
| Account | `Account.jsx` (+ `AccountReservations.jsx`, `AccountExtras.jsx`) | `account` |
| For businesses (marketing) | `BusinessLanding.jsx` | `business` |

Account sub-surfaces (tabs): **Mis reservas**, **Mis facturas**, **Favoritos**, **Familia y amigos**, **Métodos de pago**, **Notificaciones**, **Configuración**. Plus the **success/confirmation** state (post-payment) and all **modals, dropdowns and overlays** (login, recipient picker, add person, add card, review, cancellation policy, temporary-hold notice, service selector, professional selector).

**Data** lives in `data.js` (`window.RZ` — services, team, categories, businesses, footer columns) and `account-data.js` (`RZ.account` — reservations, invoices, favourites, cards, notifications, people, relationships, status maps, calendar helpers).

---

## 3. Navigation structure

- **Header** (`Header` component, two variants): `home` (logo · search · login/CTA) and `business` (logo · search · context title · notifications · favourites · account). Sticky on scroll where used. The logged-in header (bell dropdown + account menu) is wired once via `RZ.loggedInHeaderProps({ onAccount, onFavorites, onLogout })` and spread onto `<Header>` on **every** page, so the dropdowns stay identical platform-wide.
- **Search bar** (`SearchBar`): dual-field (service + location) on Home hero; compact in the header. Submitting routes to the Search screen with the query context.
- **Category navigation** (`CategoryCard`): horizontal row on Home ("Explora por categoría"); tapping a category runs a search.
- **Business cards** (`BusinessCard`, `BusinessResultCard`, `BusinessListItem`): clicking opens the business detail page.
- **Map interactions**: `MapCard` / `MapMarker` / `MapControls` / `MapToggleButton` on Search. Markers are three-state price pills (default / coral-active / dimmed); clicking a marker opens a compact popup card.
- **Footer** (`Footer`): full-width coral section with centered content; links to company, legal, social, and app-store buttons.
- **Account menu**: avatar dropdown in the header (rows rendered with the shared DS `MenuItem`, `size="md"`).
- **Notification dropdown**: bell in the header opens a **preview** panel (see §12).
- **Prototype switcher**: the floating pill at the bottom of `index.html` (Inicio / Buscar / Negocio / Reservar / Pago / Cuenta / Para negocios) — a prototype convenience, not a product nav element. Selected screen persists in `localStorage` (`rz_kit_screen`).

---

## 4. Home page behavior

- **Hero**: headline + dual-field `SearchBar` (service + location) as the primary search entry point.
- **Featured service chips**: quick taps (Corte, Uñas, Masajes, Facial, Cejas, Maquillaje) that seed a search.
- **Sections** (Fresha-style vertically-stacked `CarouselSection` rows, each with a "Ver todos los negocios →" link):
  - Explora por categoría
  - Recomendados
  - Mejor valorados
  - Nuevos
  - Cerca de mí
- **Cómo funciona Rezervame** (`HowItWorks`): 5-step explainer.
- **Footer**: full-width (see §16).

Tapping any business card → business detail. The heart on a card toggles a favourite; for logged-out users it triggers the favourite-login prompt.

---

## 5. Search page behavior

- **Filters**: category, price, rating, distance, amenities (sidebar/sheet).
- **Sorting**: the `OrdenarPor` control — a compact anchored menu (Recomendados, Mejor valorados, Más cercanos, Precio…).
- **Views**: **list**, **grid**, and **map**. A `MapToggleButton` shows/hides the map; hiding it returns the results to full width.
- **Business cards**: `BusinessResultCard` (rich) / `BusinessListItem` (compact list).
- **Map**: `MapCard` with `MapMarker` price pills and `MapControls`. Clicking a marker opens a popup preview card (`MapCard` `compact` variant) that links to the business.
- **Header dropdown layering**: the header's notification + account panels render at **`zIndex: 95`** so they always sit **above the Leaflet map and page content**. Keep this in mind for any new overlay.
- **Footer**: full-width coral; content stays inside a centered max-width container (`contentMax="min(94vw, 1600px)"`).

---

## 6. Business detail page behavior

- **Hero / portfolio**: gallery / `PortfolioGallery` + `PortfolioTile` (masonry, lightbox).
- **Business information** (`BusinessInfoPanel`): name, rating, category, hours, address; sticky sidebar.
- **Segmented tabs** (`Tabs`): Servicios / Equipo / Portfolio / Reseñas / etc.
- **Services**: `ServiceCard` list with service filters; each card has a **"Reservar"** action.
- **Staff / team**: `StaffCard` grid; each has a full-width **"Ver disponibilidad"** action.
- **Reviews**: rating summary + review list.
- **Amenities**: soft-hover amenity cards.
- **Map + info card**: location with the business info card.
- **Favourite & share**: heart toggle (auth-gated) and share (native sheet on touch, fallback menu on desktop).
- **Reservar entry points** (see §7): the sticky **"Reservar"** bar (`StickyBookingBar`), per-service "Reservar", and per-staff "Ver disponibilidad".

---

## 7. Booking flow

`Booking.jsx`. The flow **opens directly** — there is **no upfront booking-type selector** (the old "Selecciona una opción" screen was removed). The default recipient is **"Para mí"**; group structure emerges only when a second recipient is added.

### Entry points (context plumbed via `goBooking(arg)` in `index.html`)

| Entry | Call | Result |
|-------|------|--------|
| Business main "Reservar" (`StickyBookingBar`) | `onReserve()` | Opens directly, "Para mí", no service forced. |
| Service card "Reservar" | `onReserve(service)` | Opens directly with **that service preselected**. |
| Staff "Ver disponibilidad" | `onReserve({ proName })` | Opens directly with **that professional prioritized** + a "Profesional seleccionado: X" banner; default services bias to that pro when eligible. |
| Account "Reservar de nuevo" | `onReserve({ reservation })` | Opens directly **preloading** the previous business, services and recipient (recipient only when the past booking was for another / multiple people). |

### Steps (left column = builder, right column = sticky summary)

1. **Servicios** — selected services list; **"Agregar otro servicio"** opens the in-flow service selector; a subtle secondary **"Reservar para otra persona"** sits beside it.
2. **Selecciona la fecha** (`DateSelector`) — real calendar; business open Mon–Sat (Sundays disabled).
3. **Selecciona la hora** (`TimeSlotSelector`) — start time for the first service; the rest are sequenced automatically.
4. **Asigna un profesional por servicio** — per-service professional with availability; "Cambiar" opens the professional selector showing only truly-available pros.
5. **Tu secuencia** (when >1 service) — timeline of the sequenced appointments with waiting gaps.

### Multi-service sequencing logic (do not break)

- Each service starts after the previous one ends, assigned to an **eligible + available** professional (resolving "Cualquier profesional").
- Professional eligibility is per service category; availability accounts for lunch, deterministic gaps and double-booking.
- Any service that cannot be staffed at the chosen time **blocks confirmation** until the time/date/professional changes.

### Recipient inside the flow (see §8)

- "Reservar para otra persona" opens the recipient picker (Para mí / saved people / Agregar nueva persona).
- Choosing one person assigns the services to them; each row then shows **"Para: X · Cambiar"**.
- Changing individual rows to different people **auto-creates a group**, which re-renders services organized **by person** (`PersonBookingGroup` blocks with "Agregar servicio para esta persona" and "Agregar otra persona").

### Summary, fees, CTA

- **Reservation summary** (right column): services (flat with "Reserva para: Ti", or grouped by person), **total**, **cancellation fee** (visible before continuing, see §10), online-payment notice, and the **"Continuar"** button.
- **Continuar** opens the temporary-hold notice modal, then hands the built order to the **Pago** page. Success is shown only after payment is approved.

---

## 8. Booking for another person / family & friends

- **Default recipient is "Para mí".**
- The user can **book for another person** via the subtle "Reservar para otra persona" action.
- They can **select a saved family member / friend** or **add a new person inline** (no leaving the flow).
- Services display **who they are for** ("Para: X") once a non-self recipient exists.
- **Group structure only appears when multiple recipients are involved** — it is never the default. Group bookings are organized by person, each person block nesting its services.
- **Account settings include "Familia y amigos"** — a CRUD list of saved people (name, relationship, phone, optional email, optional notes). No account is required for the other person; notifications stay with the booking owner.

DS components: `RecipientBadge`, `PersonCard`, `AddPersonModal`, `RecipientPicker`, `PersonBookingGroup` (see §14).

---

## 9. Payment flow

`Checkout.jsx`. **Payment methods are card and Yappy only — there is no "Pago en el local".**

- **Card**: Rezervame places a **temporary authorization / hold** for the reservation amount. The final charge happens **after the service is completed**.
- **Yappy**: payment is **protected by Rezervame** under the same hold-until-completion model.
- **The business does not receive funds until the service is completed** (or per the cancellation policy).
- **Tip** options (preset chips + custom amount) where included.
- **Validation**: card number / expiry / CVV / name / postal code formatting and required-field checks; inline field errors.
- **Important notice**: before charging, the temporary-hold modal explains the authorization model.
- **Success / confirmation**: on approval, the user lands on the confirmation state (`BookingConfirmation`-style success), then can go to their account.

Do **not** change payment logic when editing the flow.

---

## 10. Cancellation policy logic

- Users can **cancel or reschedule up to 60 minutes before** the appointment, free of charge.
- After that window, a **late-cancellation / no-show fee** may apply.
- The business configures the fee at **50% or 100%** of the reservation total (`cancelFeePct`).
- The **cancellation fee is shown before confirming** (in the booking summary: "Cargo por cancelación · Hasta X% del total").
- A **cancellation-policy modal** ("Evita cargos por cancelación") explains the rule in full and is reachable from the summary's info affordances.

Do **not** change cancellation logic when editing.

---

## 11. Account page

`Account.jsx` — profile header + tabbed dashboard.

- **Profile header**: avatar, name, contact, and stats (reservas totales, próximas citas, favoritos).
- **Mis reservas** (`AccountReservations.jsx`): filterable/searchable reservation cards with status `Badge`, payment-status chip, "Reserva para: …" line, calendar/share menus, and actions (Ver detalles, Completar pago, Reagendar, Cancelar, Reservar de nuevo).
- **Reservation detail** (modal): when, who it's for (grouped by person for group bookings), services, totals, payment, cancellation policy and contextual actions.
- **Mis facturas**: invoice table (desktop) / cards (mobile) with status and download.
- **Favoritos**: saved businesses (`BusinessResultCard`) with empty state.
- **Métodos de pago** (`AccountExtras.jsx`): saved cards, set-default, remove, add-card modal.
- **Notificaciones**: the full notification center (see §12).
- **Familia y amigos** (`AccountExtras.jsx`): saved people CRUD (see §8).
- **Configuración**: personal info, notification preferences, security (change password), payment-methods shortcut, and **logout**.
- **Logout**: clears the session/favourites and returns to Home.

---

## 12. Notifications

- The **header bell dropdown is a preview only** — recent items rendered with `NotificationItem variant="compact"`.
- **"Ver todas"** routes to **Account → Notificaciones** (the full center), which renders `NotificationItem variant="full"` with category filters.
- **Types** (`category` / `action`): reservation, payment, review, favourite/business.
- **Read / unread**: unread rows carry a coral tint + dot + bolder title; read rows are neutral.
- **Mark all as read**: available in both the dropdown and the center.
- **Actions on click**:
  - Reservation → open reservation detail.
  - Review → open the review modal (see §13).
  - Business/favourite → open the business page.
  - Payment → view payment / refund status.

The live notification store is shared between the header dropdown and the account center so state stays consistent.

---

## 13. Reviews

- After a **completed** appointment, the user receives a review request.
- **"Dejar reseña"** opens the **review modal** (`AccountExtras.jsx`).
- The modal collects a **rating** (1–5, required), an optional **comment**, and optional **tags** (Excelente atención, Puntualidad, Lugar limpio, Buen resultado).
- On submit, a confirmation state thanks the user.
- **No duplicate reviews**: a reservation already reviewed shows "Reseña enviada" and cannot be reviewed again (tracked via `reviewedIds`).

---

## 14. Design System usage

The customer web is bound to the **Rezervame Design System** (`window.RezervameDesignSystem_4317c4`). When implementing:

- **Respect the existing system** — do not invent colours, type, spacing, shadows or radii.
- Use **tokens** (`var(--rz-*)`, `--radius-*`, `--shadow-*`, spacing/duration vars) — never hardcode values.
- Use **reusable components** wherever one exists; do not duplicate local UI patterns.
- Reference `COMPONENT_AUDIT.md` before building anything new (rule of two: promote a local helper only once a second surface needs it).

Key components:

- **Core**: `Button`, `IconButton`, `Input`, `SearchBar`, `Select`, `Checkbox`, `Radio`, `Switch`, `Chip`, `Tabs`, `Badge`, `Avatar`, `Rating`, `Glyph`.
- **Cards**: `BusinessCard`, `BusinessResultCard`, `BusinessListItem`, `BusinessInfoPanel`, `ServiceCard`, `StaffCard`, `CategoryCard`, `PortfolioTile/Gallery`.
- **Commerce**: `InvoiceTable`/`InvoiceCard`, `MapCard`/`MapMarker`/`MapControls`/`MapToggleButton`.
- **Booking**: `DateSelector`, `TimeSlotSelector`, `ReservationSummary`, `BookingConfirmation`, `OptionCard`, `PersonBookingGroup`.
- **Feedback**: `Modal`, `Toast`, `Tooltip`, `EmptyState`, `NotificationItem`.
- **People (recipient)**: `RecipientBadge`, `PersonCard`, `AddPersonModal`, `RecipientPicker`.
- **Navigation**: `Header`, `Footer`, `CarouselSection`, `StickyBookingBar`, `Menu` + `MenuItem`.
- **Auth / brand**: `LoginModal`, `BrandIcon`, `SocialIcon`, `SocialLinks`.

---

## 15. Component audit summary

From `COMPONENT_AUDIT.md`:

- **`NotificationItem`** was created (feedback group) to unify the notification row across the **header dropdown** (`compact`) and the **account center** (`full`).
- **`Menu` + `MenuItem`** were **promoted** to the Design System (anchored dropdown + row); the anchored-popover pattern recurred across the header and account surfaces.
- The **Header account menu rows now use the shared `MenuItem`** (`size="md"` preset reproduces the original styling exactly).
- **`PayStatusChip`** remains **local** (single surface, account-specific data).
- **`ActionPill`** remains **local** (single surface; overlaps the existing `Button`).
- **Family & friends / group booking** added a reusable set: `RecipientBadge`, `PersonCard`, `AddPersonModal`, `RecipientPicker`, plus `OptionCard` and `PersonBookingGroup` — each reused across Booking and Account.
- **Future promotions** should happen only when a pattern appears across **multiple surfaces**.

---

## 16. Responsive behavior

- **Footer is full-width on every page** — the coral background spans the viewport; content stays inside a centered max-width container (`contentMax="min(94vw, 1600px)"`). This is consistent across Home, Search, Venue, Account and Business Landing.
- **Cards** reflow with `auto-fill`/`auto-fit` grids; **modals** cap width and switch to bottom-sheet style on small screens.
- **Booking layout** is two-column on desktop (builder + sticky summary) and single-column stacked on mobile.
- **Avoid horizontal overflow** at every breakpoint.
- **Dropdowns and overlays must layer above the map and page content** — header panels use `zIndex: 95`; modals use the DS `Modal` scrim (`zIndex: 100`). Honour these when adding overlays.

---

## 17. Implementation notes for the developer

- **Respect the current visual design.** Do not redesign unless explicitly asked; scope changes narrowly.
- **Use Design System components and tokens** — no ad-hoc colours/spacing, no duplicated local patterns.
- **Keep payment and booking logic intact** — especially the temporary-hold model and the multi-service sequencing engine.
- **Keep the footer full-width on all pages.**
- **No hardcoded personal data** in mockups — use **fictional placeholder data only** (e.g. Ana Pérez, Laura Gómez, Carlos Rivera). Keep the account-owner option generic ("Para mí · Tu cuenta").
- **Ensure every CTA routes to the correct flow**: main "Reservar" / service "Reservar" / staff "Ver disponibilidad" / "Reservar de nuevo" all open the booking flow directly (no booking-type selector), defaulting to "Para mí".
- When adding a new component, add a `@dsCard` specimen and a `.d.ts`, and keep `readme.md` current; run the design-system check after edits.

---

## 18. File map (quick reference)

```
ui_kits/customer-web/
  index.html            # composes screens + switcher; routing & app-level state
  data.js               # window.RZ — services, team, categories, businesses, footer
  account-data.js       # RZ.account — reservations, invoices, people, notifications…
  Home.jsx              # discovery / search entry
  SearchResults.jsx     # list / grid / map results
  VenuePage.jsx         # business detail
  Booking.jsx           # reservation flow (individual-by-default, group emergent)
  Checkout.jsx          # payment (card / Yappy) + success
  Account.jsx           # dashboard shell + tabs
  AccountReservations.jsx  # Mis reservas + detail + cancel/reschedule/rebook
  AccountExtras.jsx     # Favoritos, Métodos de pago, Familia y amigos, Notificaciones, Configuración, Reseña
  BusinessLanding.jsx   # "Para negocios" marketing
  README.md             # kit overview
  COMPONENT_AUDIT.md    # component inventory + audit
  CUSTOMER_WEB_SPEC.md  # this document
```
