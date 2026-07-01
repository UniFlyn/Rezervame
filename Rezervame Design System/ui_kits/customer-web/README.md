# Customer Web — UI Kit

High-fidelity recreation of the Rezervame customer-facing web experience, built entirely from the design-system primitives. Open `index.html` and use the floating switcher to move between screens.

## Screens
| File | Screen | Notes |
|------|--------|-------|
| `Home.jsx` | Discovery / search | Hero with the dual-field search, then Fresha-style vertically-stacked sections (Explora por categoría, Recomendados, Mejor valorados, Nuevos, Cerca de mí) — each a horizontal `CarouselSection` row with a "Ver todos los negocios →" link. Click a business → Venue. |
| `VenuePage.jsx` | Business profile (Luxe Hair Studio) | Gallery, title block, segmented tabs (Servicios / Equipo / Portfolio …), service list, staff grid, masonry portfolio, sticky info sidebar, categories, footer. |
| `Booking.jsx` | Booking flow + confirmation | Professional picker, date strip, time-slot grid, live summary, and the `BookingConfirmation` success modal. |
| `Checkout.jsx` | Payment | Credit / Yappy tabs, card form with brand logos, order summary, totals, TRUSTe. |
| `Account.jsx` | Account | Profile header, reservations list, invoices table, favourites empty state. |

## Data
`data.js` holds all demo content (`window.RZ`) — services, team, categories, businesses, imagery (Unsplash), footer columns.

## How it's wired
- Loads `../../_ds_bundle.js` and reads components from `window.RezervameDesignSystem_4317c4`.
- Each screen registers itself on `window` (e.g. `window.VenuePage`) so `index.html` can compose them.
- Selected screen persists in `localStorage` (`rz_kit_screen`).

These are cosmetic recreations for design reference, not production code.
