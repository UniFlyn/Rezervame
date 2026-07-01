# Rezervame Design System — Component Audit

_Audit of all client-facing pages (Home, Search, Business detail, Booking, Payment, Account, modals, dropdowns, notifications, header, footer) against the component library._

## Summary

The system is **already in strong shape**: 50 → **51 components** cover the full
customer surface, and the pages consume them consistently. Pages are thin
compositions of DS primitives, not hand-rolled UI. One genuine cross-surface
duplication was found and consolidated; the rest of the inline markup is
legitimate page-specific layout built _from_ tokens and primitives.

## 1. Already correct (no change needed)

These repeated elements are proper, reused components and every page uses them:

- **Core** — `Button` (primary / secondary / outline / ghost / dark / danger, sizes, `fullWidth`, `loading`, `leftIcon`), `IconButton` (badge, round, variants), `Input` (label / helper / error / disabled / trailing / icon), `SearchBar`, `Select`, `Checkbox`, `Radio`, `Switch`, `Chip` (active / count / uppercase), `Tabs`, `Badge` (success / warning / error / info / coral / navy / neutral + `dot` + sizes), `Avatar`, `Rating`, `Glyph`.
- **Cards** — `BusinessCard`, `BusinessResultCard`, `BusinessListItem`, `BusinessInfoPanel`, `ServiceCard`, `StaffCard`, `CategoryCard`, `PortfolioTile/Gallery`.
- **Commerce** — `InvoiceTable` / `InvoiceCard`, `MapCard` / `MapMarker` / `MapControls` / `MapToggleButton`.
- **Booking** — `DateSelector`, `TimeSlotSelector`, `ReservationSummary`, `BookingConfirmation`.
- **Feedback** — `Modal`, `Toast`, `Tooltip`, `EmptyState`.
- **Navigation** — `Header` (home / business variants, sticky, notifications + account dropdowns), `Footer`, `CarouselSection`, `StickyBookingBar`.
- **Auth / brand** — `LoginModal`, `BrandIcon`, `SocialIcon`, `SocialLinks`.

## 2. Converted into a component this pass

- **`NotificationItem`** (`components/feedback/`) — the notification row was
  hand-built **twice**: once in the `Header` bell-dropdown and again in the
  Account `NotificationCenter`. Now one component with two layouts and shared
  state logic:
  - `variant="compact"` — header dropdown row (icon · title · time · dot).
  - `variant="full"` — account center row (toned icon · title + category badge · message · date + action/reviewed · dot, optional `divider`).
  - States: **unread** (coral tint, bolder title, trailing dot) / **read**, plus hover; built-in icon-tone map so coloring stays consistent everywhere.
  - Wired into both `Header.jsx` and `AccountExtras.jsx`; markup is pixel-identical to before. Added to the Design System tab (`notification.card.html`).

## 3. Inconsistencies found

- **Notification rows** drifted between the two surfaces (different tone maps,
  weights, dot sizes) — now unified by `NotificationItem`. ✅ Fixed.
- No other token drift found — pages reference `--rz-*` color, radius, shadow,
  spacing and duration tokens rather than hard-coded values.

## 4. Local-helper promotion review

Each of the three helpers flagged earlier, re-checked against actual usage:

- **`Menu` + `MenuItem`** — **PROMOTED** to `components/navigation/Menu`.
  Although defined in `AccountReservations.jsx`, the anchored-popover mechanism
  (outside-click / Escape close, right-aligned panel) is **duplicated** — `Header`
  re-implements the same popover for its account + notification dropdowns, and the
  sort/share menus repeat it. It's generic infrastructure (already exported to
  `window` "for reuse"), so it belongs in the DS. `MenuItem` gained additive
  optional props — `danger`, `divider`, `badge` — so other surfaces (e.g. the
  Header account menu) can adopt it without forking; defaults reproduce the
  current Account row exactly. Account usages now consume the DS components; no
  visual change.
- **`PayStatusChip`** — **KEPT LOCAL.** Used twice but on a **single surface**
  (Account › reservations card + details modal) and bound to account-only
  `RZ.account.PAYSTATUS` data. Promote only when a 2nd surface (e.g. Checkout or
  invoices) needs payment status — then fold it into a shared `StatusChip`/Badge
  tone source.
- **`ActionPill`** — **KEPT LOCAL.** Single surface, and it functionally overlaps
  the existing `Button` (`variant="outline" size="sm" leftIcon`). Adding a second
  button-like primitive would *reduce* consistency. Recommend folding into
  `Button` if it's ever needed elsewhere.

### Still-open (recommendations, not done)
- ~~**Header account menu** can migrate to the DS `MenuItem`~~ — **DONE.** The
  Header account-menu rows now render via the shared `MenuItem` (new `size="md"`
  preset reproduces the taller nav-menu spec exactly: gap 12 / 14px / weight 500
  / radius-md / 18px gray-500 icons / gray-050 hover). The popover *shell* was
  intentionally left bespoke — it carries a profile header, `zIndex:95` (above the
  map), `shadow-lg` chrome, and the shared outside-click/Escape that mutually
  excludes the notifications panel — so it is not a duplicate of the generic
  `Menu`. Last duplicate menu-row implementation removed.
- **`FavoritePrompt`** (index.html) and **payment-method tabs / tip selector**
  (Checkout) — one-off compositions; componentize only if they recur.
- **Delete-card icon button** (AccountExtras) — raw `<button>`; could use
  `IconButton` with a danger hover.

## 5. Recommendations to keep the DS scalable

1. **Rule of two**: promote a local helper to `components/` the moment a second
   surface needs it (that's exactly what triggered `NotificationItem`).
2. Keep adding a `*.card.html` for every new component so it stays visible and
   documented in the Design System tab.
3. Consider a single `StatusChip`/status-tone map shared by `Badge`,
   `PayStatusChip` and reservation states so status colours have one source.
4. The brand-icon source (`assets/brand-icons/icon-data.js`, 111 KB) bloats the
   bundle — consider tree-shaking to only the marks in use.

---

## Feature: Book for family & friends (post-implementation audit)

**New DS group `components/people/`** — every piece is reused across Booking + Account:
- `RecipientBadge` — read-only "Para: X" indicator (Booking summary + service rows, reservation cards, reservation details).
- `PersonCard` — `manage` (Account list, with edit/remove) and `select` (RecipientPicker option) variants; default / hover / selected states.
- `AddPersonModal` — add **and** edit a person (Name, Relación, Teléfono, Email opcional, Notas); reused by Account and by RecipientPicker's inline "Agregar nueva persona".
- `RecipientPicker` — "¿Para quién?" selector: "Para mí" + saved people + inline add. Composes PersonCard + AddPersonModal.

**Reused existing components (no duplicates created):** Modal, Input, Select, Button, Avatar, Badge, IconButton, Glyph, EmptyState, Toast, SectionCard pattern, Tabs.

**Where it appears:**
- Account → new **"Familia y amigos"** tab (CRUD list, empty state, add/edit/remove) via `AccountPeople`.
- Booking → **"¿Para quién es esta reserva?"** panel (Para mí / Para otra persona / Para mí y otra persona) after Servicios; per-service recipient assignment for the "both" case; recipient lines in the live summary.
- Reservation summary, **Mis reservas** cards, and reservation **details** show "Reserva para: …" (Ti / name / N personas) and per-service "Para: X".

**Data:** `RZ.account.people` + `RZ.account.RELATIONSHIPS` in account-data.js; per-service `for` field on reservations and on the order built by Booking. Notifications stay with the account owner; the other person needs no account (stated in the section footnote).

**Audit result:** no duplicated local UI — the recipient/person UI lives entirely in the DS `people/` group and both Booking and Account consume the same components. Payment, scheduling, professional-assignment and multi-service sequencing logic were left untouched. Styling uses existing tokens throughout.

**Recommendation:** if a future surface needs to *display* a saved person inline (not pick/manage), `PersonCard` already covers it; consider a tiny read-only `variant="compact"` only if such a need appears (rule of two).

---

## Feature: Individual vs group booking (Fresha-style)

**New DS components (booking group):**
- `OptionCard` — large Fresha-style choice card (title + subtitle + accent icon). Used for the "Selecciona una opción" step (Reservar una cita / Reservar cita grupal); reusable for any path chooser.
- `PersonBookingGroup` — a person block nesting that recipient's services (header "Para mí · Tu cuenta" or person + relationship, service rows, optional "Agregar servicio para esta persona" + per-person remove). Reused in the **group booking flow**, the **grouped reservation summary** (compact inline variant) and **reservation details**.
- Added a `users` glyph to the DS icon set.

**Reused (no duplicates):** RecipientPicker / AddPersonModal / PersonCard / RecipientBadge (from the people group), Button, Input, Modal, Avatar, Badge, Glyph, Panel.

**Flow:**
- **Main "Reservar"** (StickyBookingBar, no service) → `OptionCard` step first; individual → normal flow (default "Para mí"); group → person-organized flow.
- **Service-card "Reservar"** → straight into the flow with that service preselected, default "Para mí", plus a subtle "Agregar otra persona o convertir en cita grupal".
- **Group** organizes by person: `PersonBookingGroup` per recipient, "Agregar servicio para esta persona" (service selector auto-assigns to that person), and "Agregar otra persona" (RecipientPicker). **Individual** stays a single-person reservation with a subtle "Reserva para: Ti" + "Cambiar destinatario / Reservar para otra persona".
- **Summary** groups services by person (name → service · pro · time · price) with total / cancellation policy / Continuar unchanged.
- **Mis reservas / details** show services grouped by person for group bookings (`PersonBookingGroup`), or "Reserva para: Ti / nombre" otherwise.

**Untouched:** payment logic, cancellation-policy logic, and the service/date/time/professional **sequencing engine** (it still runs on the flat services array; grouping is presentational + per-service `forId`).

**`ServiceAssignmentRow`** (suggested) was intentionally **not** created — service rows are simple and already covered by `PersonBookingGroup`'s `services` prop; a separate component would be redundant (rule of two).

### Follow-up: removed the upfront booking-type selector
The "Selecciona una opción" (`OptionCard`) screen was removed — it forced an individual/group choice on entries like staff "Ver disponibilidad" and "Reservar de nuevo". The flow now **opens directly, default "Para mí"**, and group structure **emerges only when a 2nd recipient is added** (`grouped = groupPeople.length > 1`).
- Simple Servicios panel shows a subtle secondary **"Reservar para otra persona"** next to "Agregar otro servicio" (link-style, never competing with Continuar). The old "Reserva para: Ti" bar + "convertir en cita grupal" line were removed (recipient now reads in the summary).
- Booking entry context is now plumbed via `goBooking(arg)`: a **service** (preselect), a **`{proName}`** (staff → preselects/prioritizes that professional + "Profesional seleccionado: X" banner), or a **`{reservation}`** ("Reservar de nuevo" → preloads services + recipient + business; recipient only when the previous booking was for another/multiple people).
- `OptionCard` remains in the DS (still card-documented) for future choice screens; `PersonBookingGroup` gained an optional per-row `onChange` ("Cambiar" recipient).
