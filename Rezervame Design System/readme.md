# Rezervame — Design System

The official visual foundation for **Rezervame**, a customer-facing beauty &
wellness booking platform for **Panama**. Use it to design and build the
customer web experience: discovering salons, barbershops, spas and beauty
professionals; browsing services, portfolios and staff; booking appointments;
managing reservations; downloading invoices; and completing payments.

> Built for a real Next.js + Tailwind + shadcn/ui product. The CSS custom
> properties here map cleanly onto Tailwind theme tokens and shadcn variables.

The product is bilingual-friendly but the reference content is **Spanish (Panama)**.
The brand should feel **modern, clean, premium, friendly, elegant, trustworthy
and effortless to navigate** — inspired by Booksy/Fresha but unmistakably Rezervame.

---

## Sources (for provenance — reader may not have access)
- **Figma:** `rezervame 2.0.fig` (mounted virtual file). Primary 2.0 mockup. Note: the
  Figma file is built in **Poppins**, which is also the official UI font for the
  customer experience, so foundations follow it.
- **Brand identity package:** logos (`uploads/FULLCOLOR.png`, `BLACKLOGO.png`,
  `FASE3_LOGOFINAL.pdf`), color + font rules, `App Name Brief`.
- **Target reference images** (high priority): `uploads/target_*.png` — venue header,
  services page, team, portfolio, sticky bar, booking confirmation, checkout, invoices.
- **Product/onboarding docs:** `Rezervame_DevOnboarding_Extended.pdf`,
  `Points_to_Review_Rezervame_EN.pdf`, `rezervame 2.0.pdf`.
- **Current dev screenshots** (`uploads/current_*.png`): secondary context only — NOT a
  design target.

---

## Index / manifest
- **`styles.css`** — the single entry point consumers link. `@import`s only.
- **`tokens/`** — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `elevation.css`, `base.css`.
- **`assets/`** — `logos/` (color, black, white wordmarks); `fonts/` (Poppins, self-hosted); `brand-icons/` (Visa/MC/Amex + social logos extracted from Figma → `BrandIcon`).
- **`components/`** — reusable React primitives (see below).
- **`guidelines/`** — foundation specimen cards (Design System tab).
- **`ui_kits/customer-web/`** — full click-through recreation of the customer site
  (Home → Search results → Venue → Booking → Checkout → Account).
- **`SKILL.md`** — Agent-Skill manifest for downloadable use.

### Components
- **core/** — `Glyph`, `Button`, `IconButton`, `Input`, `SearchBar`, `Select`,
  `Checkbox`, `Radio`, `Switch`, `Chip`, `Tabs`, `Badge`, `Avatar`, `Rating`,
  `TruncatedReveal` (truncate + full-value reveal on hover/focus/tap),
  `SocialIcon`, `SocialIconButton`, `SocialLinks`.
- **cards/** — `ServiceCard`, `StaffCard`, `BusinessCard`, `BusinessResultCard`,
  `BusinessListItem`, `CategoryCard`, `BusinessInfoPanel`, `PortfolioGallery`, `PortfolioTile`.
- **booking/** — `DateSelector`, `TimeSlotSelector`, `ReservationSummary`
  (multi-service, per-recipient), `BookingConfirmation` (no-scroll modal),
  `OptionCard` (Fresha-style choice card — individual vs group),
  `PersonBookingGroup` (person block nesting that recipient's services).
- **feedback/** — `Modal`, `Toast`, `Tooltip`, `EmptyState`, `NotificationItem` (compact header-dropdown row + full account-center row, unread/read states).
- **people/** — `RecipientBadge` (read-only "Para: X" indicator), `PersonCard` (manage / select), `AddPersonModal` (add/edit a family member or friend), `RecipientPicker` ("¿Para quién?" selector with inline add). Used by Booking (recipient selection) + Account (Familia y amigos).
- **auth/** — `LoginModal` (base login / sign-up modal).
- **navigation/** — `Header`, `Footer`, `CarouselSection` (Fresha-style Home section row), `StickyBookingBar` (Booksy-style venue "Reservar Ahora" bar), `Menu` + `MenuItem` (anchored dropdown: outside-click/Escape close; rows support danger / divider / badge).
- **commerce/** — `InvoiceTable` (desktop), `InvoiceCard` (mobile), `MapMarker` (three-state price pill: default / coral active / dimmed), `MapCard` (preview card, `compact` map-tooltip variant), `MapControls` + `MapToggleButton` (the "Ver mapa" / "Ocultar mapa" controls shown above the results map).
- **marketing/** — `HowItWorks` ("Cómo funciona Rezervame" 5-step explainer).
- **brand-icons/** — `BrandIcon` (payment + social marks).

All components read CSS custom properties from `styles.css` and are exposed on
`window.RezervameDesignSystem_4317c4` in the compiled bundle.

---

## VISUAL FOUNDATIONS

**Color.** Two official brand colors carry the system — **never substituted by
scale steps**:
- **Prussian Blue `#023047`** (`--rz-navy`) — official primary dark. All headings,
  important text, strong hierarchy, dark UI accents, prices, the active filter chip.
  `#011D2C` (navy-900) is for very dark backgrounds / high-emphasis surfaces only.
- **Bittersweet / Rezervame Red `#FF5757`** (`--rz-coral`) — official accent. The
  logo, primary CTAs ("Buscar", "Reservar", "Pagar"), important links,
  active/selected states, key highlights, the coral footer. **States only:**
  `#F04646` hover, `#D83B3B` pressed (= error red). Darker steps never replace the
  resting accent.
- **Gold `#FDC700`** — *ratings, stars and review UI only* — never a general accent.
- **Neutrals** — a warm-leaning gray ramp. Page sections sit on `--rz-gray-050`
  (#F7F8FA); cards are pure white; borders are `--rz-gray-200/300`.
- **Status (semantic UI states only)** — success green (Pagada), warning amber
  (Pendiente), error red (Cancelada), info blue. Not decorative/brand colors.

See `tokens/colors.css` for the full role map (`--action-*`, `--selected-*`,
`--text-*`, `--border-*`, `--surface-*`, `--rating-*`) and the **Color Usage Rules**
card in the Design System tab.

**Type.** **Poppins** for everything UI (300–900; core relies on 400/500/600/700),
self-hosted from `assets/fonts/` per the approved Rezervame 2.0 mockup. Headings are
**Bold + Prussian Blue**, slightly tight tracking (−0.5px display/H2, −0.25px
H3/H4). Section titles are centered, ~32px, often with a muted sub-line under
them. Eyebrows/labels are **uppercase, 12px, tracked 0.12em, muted gray** ("SOBRE
NOSOTROS", "HORARIO", "FECHA Y HORA"); the coral uppercase variant marks "TU
RESERVA" / "152 RESERVAS". Body is 16px gray-700. Buttons are 14px / SemiBold 600
(large CTAs 16px). Minimum text size is 12px.
**Cocogoose Pro is the logo wordmark only — never the UI font.**

**Shape & radius.** Soft and rounded. Cards 12–16px, panels/sidebar 20px, modals
& the checkout shell 28px. Pills (999px) for the search bar, hero CTAs, tabs,
filter chips and badges. Inputs 12px.

**Elevation.** Soft, warm-neutral ambient shadows (tinted with navy, not pure
black). Cards use `--shadow-card` (0 4px 16px). Modals get a deep `--shadow-modal`.
Primary coral CTAs carry a subtle coral **glow** (`--shadow-coral`). Hover lifts a
card by 2–3px and deepens its shadow.

**Backgrounds & imagery.** Generous real photography — salon interiors, hair work,
staff portraits — shown full-bleed in galleries and behind a **dark bottom-gradient**
on category tiles (white uppercase label over the image). The hero overlays a navy
gradient on a photo with white headline + coral accent word. No decorative
patterns, no purple/blue gradients, no noise.

**Borders.** 1px `--rz-gray-200` hairlines for dividers and 1.5px for inputs /
outlined buttons. Selected items switch their border to coral. Dividers inside
panels separate labelled sections.

**Motion.** Quick and confident: 120–200ms `ease-standard`. Buttons scale to 0.97
on press and brighten ~4% on hover; cards lift; the switch/toggle knob slides on
`ease-out`. Modals fade + pop (translateY 12px → 0, scale 0.97 → 1). No bouncy or
infinite decorative animation.

**States.**
- *Hover:* brightness −4% (filled), border→coral + text→coral (outline/chip), card lift.
- *Active/press:* scale 0.97.
- *Selected:* coral border + coral title (service card), coral fill (date/time pill, chip).
- *Disabled:* 50% opacity, `not-allowed`; time slots also strike through.
- *Loading:* spinner replaces the left icon; label stays.

**Layout.** Max content width 1280px, 24px gutters. Venue page = content + 340px
sticky sidebar. Header is 84px, white, sticky-ready. Footer is full-bleed coral.

---

## CONTENT FUNDAMENTALS

**Language & voice.** Spanish (Panama), warm and direct. Speaks **to "tú"**
("Reserva citas estés donde estés", "Elige tu categoría", "Prepárate para una
experiencia de primer nivel"). Friendly and premium, never stiff or salesy.

**Casing.**
- The brand wordmark is **always lowercase**: "rezervame".
- Section titles use **Title/sentence case** ("Nuestros Servicios", "Elige tu categoría").
- Buttons & eyebrows are often **UPPERCASE** ("REZERVAME", "VER DISPONIBILIDAD",
  "TODOS", "SOBRE NOSOTROS"). Big CTAs use sentence case ("Reservar Ahora", "Buscar").

**Tone examples.**
- Reassurance: *"Tu información está protegida y se mantiene confidencial."*
- Celebration: *"¡Reserva exitosa!"* (with "exitosa" in coral).
- Helpful sub-lines under titles: *"Descubre el servicio perfecto para ti."*

**Numbers & money.** Prices are `$` + amount, Prussian-blue and bold on cards;
**coral** for the grand total and invoice amounts. Durations are uppercase meta
with a clock icon ("60 MIN", "3-4 HORAS"). Ratings: "4.9" bold + gold stars +
"(287 reseñas)".

**Emoji:** not used. Iconography carries all glyph meaning.

---

## ICONOGRAPHY

Two icon sources, by purpose:
1. **UI glyphs → `Glyph`** (`components/core/Glyph.jsx`). A self-contained,
   **Lucide** stroke set (authentic Lucide geometry, 24px grid, 2px stroke, round caps, `currentColor`):
   search, mapPin, clock, calendar, star, heart, bell, chevrons, check/checkCircle,
   phone, mail, share, plus, close, download, print, lock, user, scissors, sparkles,
   shield, creditCard, settings, etc. Recolor with the CSS `color` property.
   *(The Figma's own glyph set was sparse and partly undecodable, so the system
   ships this Lucide-aligned set instead — see Caveats.)*
2. **Brand / payment marks → `BrandIcon`** (`assets/brand-icons/`). Real
   full-color logos extracted from the Figma: Visa, Mastercard, Amex, and social
   marks (Facebook, Instagram, YouTube, TikTok, LinkedIn, Apple, Google). Do not
   recolor the coloured variants.

Social icons render through the standalone **`SocialIcon`** (solid brand glyph),
**`SocialIconButton`** (circular button — `footer`/`neutral`/`coral`/`dark`
variants, 32/40/48px, hover + pressed + disabled states) and **`SocialLinks`**
(a row of them) components. `Footer` consumes `SocialLinks`.
Emoji and unicode glyphs are never used.

---

## Quick start for consumers
```html
<link rel="stylesheet" href="styles.css" />
<script src="_ds_bundle.js"></script>
<script>
  const { Button, ServiceCard, Header } = window.RezervameDesignSystem_4317c4;
</script>
```
Everything is also visible card-by-card in the **Design System** tab.

---

## CAVEATS
- **UI font:** **Poppins** (per the approved Rezervame 2.0 mockup), self-hosted from
  `assets/fonts/` via `@font-face` in `tokens/fonts.css` (weights 300–900). The old
  Space Grotesk TTFs have been removed.
- **Cocogoose Pro** (logo font) is not installed and isn't defined as a CSS token —
  the wordmark ships as a **PNG** (`assets/logos/`), never as live webfont text, so
  it isn't needed at runtime. *Upload Cocogoose Pro only if you need to set the
  wordmark as live text.*
- **Icons:** the Figma glyph set was incomplete/undecodable, so UI icons use a
  Lucide-style set (`Glyph`). Payment + social **brand** logos are the real Figma assets.
- **Demo imagery** in cards/kits uses Unsplash URLs (online). Swap for owned photography
  in production.
