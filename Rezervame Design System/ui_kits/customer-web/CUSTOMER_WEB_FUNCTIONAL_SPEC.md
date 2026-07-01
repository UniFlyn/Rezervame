# Rezervame Customer Web — Functional Specification

> A plain-language guide to how the Rezervame customer web works **from the user's perspective**. No code knowledge required. For the engineering-level reference (files, components, internals), see `CUSTOMER_WEB_SPEC.md`.

---

## 1. What Rezervame is

Rezervame is a **beauty and wellness booking platform**. People use it to discover salons, spas, barbershops and independent beauty or wellness professionals, compare them, and book an appointment in a few minutes.

A customer can:

- Search by service, business name, or category.
- Compare businesses by rating, price, distance and the services they offer.
- Explore a business — its services, team, portfolio, reviews and amenities.
- Book one or more services, choose a professional, and pick a date and time.
- Pay securely online, with the money held until the service is actually delivered.
- Manage everything afterwards — reservations, invoices, favourites, saved people and settings — from their account.

The experience is designed to feel **simple by default**: most people are booking one service for themselves, and the flow stays out of their way until they ask for more.

---

## 2. The main customer journey

A typical end-to-end journey:

1. The user lands on Rezervame.
2. They search for a service, business or category.
3. They review the results — as a list, a grid, or on a map.
4. They open a business profile that looks interesting.
5. They browse its services, staff, portfolio, reviews and amenities.
6. They start a reservation.
7. They choose the service(s), date, time and professional.
8. Optionally, they book for someone else (a family member or friend).
9. They review the cancellation policy and the total.
10. They continue to payment.
11. They receive a confirmation.
12. Later, they manage the reservation from their account — reschedule, cancel, rebook, or leave a review.

Each step flows naturally into the next, and the user can always go back to adjust earlier choices.

---

## 3. Main pages and their purpose

| Page | What it's for | Key actions | Where they lead |
|------|---------------|-------------|-----------------|
| **Home** | Start discovery | Search, tap a category, open a recommended business | Search results or a business profile |
| **Search results** | Compare and choose a business | Filter, sort, switch list/grid/map, open a business | A business profile |
| **Business detail** | Decide and start booking | Browse services/staff/reviews, favourite, share, "Reservar" / "Ver disponibilidad" | The booking flow |
| **Booking** | Build the reservation | Add services, pick date/time/professional, optionally book for others | The payment page |
| **Payment** | Pay securely | Choose card or Yappy, confirm | The confirmation state |
| **Confirmation** | Reassure the user it worked | Continue to account | The account |
| **Account** | Manage everything | Open any tab below | The relevant section |
| **Notifications center** | See all updates | Read, mark all read, act on a notification | Reservation, business, payment, or review |
| **Familia y amigos** | Manage saved people | Add, edit, remove a person | Reused in booking |
| **Settings** | Manage profile & preferences | Edit info, change password, manage cards, log out | — |

---

## 4. Home page

The home page exists to **start discovery quickly**.

- **Search bar** — the main entry point: the user types a service and a location and goes straight to results.
- **Featured service chips** — one-tap shortcuts (Corte, Uñas, Masajes, Facial, Cejas, Maquillaje) that launch a search.
- **Categories** — browse by type of business.
- **Curated sections** — Recomendados, Mejor valorados, Nuevos, and Cerca de mí, each a scrollable row of businesses with a "see all" link.
- **"Cómo funciona Rezervame"** — a short explainer of how booking works, for first-time visitors.
- **Footer** — full-width, with company, legal, social and app links.

**Main user goal:** find a starting point — a service, a category, or a specific business.

---

## 5. Search page

The search page helps the user **compare options and choose a business**.

- **Filters** — narrow by category, price, rating, distance and amenities.
- **Sorting** — order results by relevance, rating, distance or price.
- **Three views** — a **list**, a **grid**, or a **map**. The user can show or hide the map; hiding it gives the results the full width.
- **Business cards** — each shows the essentials (photo, rating, category, distance, price range, sample services) and opens the business profile.
- **Map markers** — price "pills" on the map; tapping one opens a small popup card that links to the business.
- **Header dropdowns above the map** — the notifications and account menus always appear **above** the map and the rest of the page, so they're never hidden behind it.

**Main user goal:** confidently pick the right business to book with.

---

## 6. Business detail page

This page gives the user everything they need to **decide and start booking**.

- **Business information** — name, rating, category, hours and location.
- **Services** — the menu of bookable services, each with price and duration.
- **Staff** — the professionals, with their ratings and specialties.
- **Portfolio** — photos of real work.
- **Reviews** — feedback from other customers.
- **Amenities** — what the place offers.
- **Map / location** — where to find the business.
- **Favourite & share** — save the business or share it with someone.

### Reservation entry points

There are three ways to begin a booking, and **each opens the booking flow directly** — the user is never asked, up front, whether the booking is "individual or group."

- **Main "Reservar" button** (the sticky bar at the top): opens the booking flow directly, ready for the user to add services.
- **A service's "Reservar" button**: opens the booking flow **with that service already selected**, so the user can go straight to date and time.
- **A staff member's "Ver disponibilidad" button**: opens the booking flow **with that professional prioritized** — the page makes clear who's selected ("Profesional seleccionado: …") and the user then picks the service, date and time for that professional.

---

## 7. Booking flow

The booking flow is built to stay **simple by default**.

- **The reservation is for "Para mí" by default.** The user is not forced to choose between an individual or a group booking before they begin — they just start booking.
- **Add services** — start with a preselected service (if they came from one) and add more with "Agregar otro servicio".
- **Choose the date** — a calendar limited to the business's open days.
- **Choose the time** — the user picks the start time for the first service.
- **Assign a professional** — each service can be handled by a different professional, and the flow only offers people who are genuinely available.
- **Multiple services are sequenced automatically** — each one starts after the previous finishes, so the user gets a clean, realistic schedule without manual juggling.
- **Review the summary** — services, who they're for, the total, and the cancellation fee, all visible before committing.
- **Continue to payment** — a short notice explains the temporary hold, then the user proceeds to pay.

If a chosen time can't be staffed, the flow says so and asks the user to adjust the time, date or professional before continuing.

---

## 8. Booking for another person / family & friends

Most people book for themselves, so **"Para mí" is always the default** and the flow never pushes group booking on anyone.

When the user *does* want to book for someone else:

- They tap a **subtle secondary action — "Reservar para otra persona"** — sitting quietly next to "Agregar otro servicio". It is deliberately not a prominent button and never competes with the main "Continuar" action.
- They can **pick a saved person** or **add a new one on the spot** (name, relationship, phone, optional email and notes) without leaving the booking.
- **Saved people live in Account → Familia y amigos**, so they're reusable next time.
- **The other person does not need their own Rezervame account.** The booking and its notifications stay with the person who made it.
- Once a service is assigned to someone other than the account owner, that service shows **who it's for**.
- **Group booking appears only when more than one person is involved.** At that point the reservation reorganizes itself **by person**, with each person's services grouped together and the option to add a service for that person or add another person.

**Example of a group reservation:**

> **Para mí**
> - Corte de cabello
>
> **Ana Pérez**
> - Manicure
>
> **Carlos Rivera**
> - Corte de niño

---

## 9. Payment flow

Payment is intentionally limited and protective of both sides.

- **Only two methods: card and Yappy.** There is **no "Pago en el local"** (no pay-at-the-venue option).
- **Card payments use a temporary hold / authorization** — the amount is reserved, not charged outright.
- **Yappy may process the payment immediately**, but the **funds stay protected by Rezervame** — it does not necessarily work like a card-style temporary authorization.
- **The funds are not released to the business until the service is completed**, or as the cancellation policy dictates.
- Before paying, the user sees an **important notice** explaining the hold and how it works.
- **Confirmation appears only after the payment or authorization succeeds** — never before.

This keeps the experience trustworthy: the customer is protected until the service is delivered, and the business knows the booking is backed by a valid online payment or authorization.

---

## 10. Cancellation policy

- The user can **cancel or reschedule for free up to 60 minutes before** the appointment.
- After that window, a **late-cancellation or no-show fee may apply**.
- Each business sets its fee at **50% or 100%** of the reservation total.
- The **fee is always visible before the user confirms** the reservation.
- A **policy modal** explains the rule in full, reachable from the booking summary.

---

## 11. Account page

The account is the user's home base for everything after (and before) a booking.

- **Mis reservas** — all reservations, filterable by status:
  - **Upcoming** — confirmed appointments, plus recoverable incomplete bookings only when applicable. A normal upcoming reservation is one whose payment or authorization completed. If it did **not** complete, it is not treated as a normal confirmed reservation — it appears separately with a clear status such as **"Pago no completado"**, and only while the slot can still be recovered (the user can finish payment to confirm it).
  - **Completed** — past appointments.
  - **Cancelled** — cancelled or no-show.
  - Each reservation opens a **detail view** with the full breakdown (when, who it's for, services, totals, payment and policy).
  - From here the user can **rebook** ("Reservar de nuevo"), **cancel or reschedule** when still allowed (more than 60 minutes out), and **leave a review** after a completed appointment.
- **Mis facturas** — invoice history with statuses and downloads.
- **Favoritos** — saved businesses, ready to rebook.
- **Métodos de pago** — saved cards: add, set default, remove.
- **Notificaciones** — the full notifications center (see §12).
- **Familia y amigos** — saved people the user can book for (see §8).
- **Configuración** — personal info, notification preferences, password/security, a shortcut to payment methods, and **logout**.

---

## 12. Notifications

- The **bell in the header is a quick preview** — just the most recent updates.
- **"Ver todas" opens Account → Notificaciones**, the full center with filtering.
- Notifications have **read and unread** states; unread ones stand out.
- The user can **mark all as read** from either place.
- Many notifications are **actionable**:
  - **View a reservation** (opens its detail).
  - **Leave a review** (opens the review flow).
  - **Open a business** page.
  - **View a payment or refund status**.

---

## 13. Reviews

- After a **completed** appointment, the user is invited to share their experience.
- **"Dejar reseña" opens a review flow tied to that specific reservation.**
- A **rating is required**; a **comment is optional** (plus optional quick tags like "Puntualidad" or "Lugar limpio").
- **A reservation can only be reviewed once** — after submitting, it's marked as reviewed and won't ask again.

---

## 14. Design and implementation expectations

- **Respect the existing visual design** — don't redesign; match what's already there.
- **Use the established Design System** for every element.
- **Don't introduce inconsistent buttons, cards, modals or dropdowns** — reuse the shared ones.
- **Keep the footer full-width on every page.**
- **Keep header dropdowns above the map and page content.**
- **Use fictional placeholder data only** — never real personal names in mockups (e.g. Ana Pérez, Laura Gómez, Carlos Rivera). When referring to the **account owner**, use generic labels such as **"Para mí"**, **"Tu cuenta"**, or **"Para mí · Tu cuenta"** — do not display a real-looking personal name for the account owner unless the design specifically requires authenticated user data.

---

## 15. Functional checklist for the developer

- [ ] Every reservation entry point opens the correct flow.
- [ ] Staff "Ver disponibilidad" prioritizes that professional.
- [ ] Service "Reservar" preselects that service.
- [ ] Account "Reservar de nuevo" rebuilds the previous reservation's context.
- [ ] Booking defaults to "Para mí" (no upfront individual/group choice).
- [ ] "Reservar para otra persona" is a secondary, non-dominant action.
- [ ] Family/friends can be added and reused across bookings.
- [ ] Payment shows only card and Yappy (no pay-at-venue).
- [ ] The cancellation fee is visible before confirming.
- [ ] Notifications "Ver todas" opens Account → Notificaciones.
- [ ] The footer is full-width on every page.
- [ ] Dropdowns and overlays appear above the map.
