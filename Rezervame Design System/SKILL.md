---
name: rezervame-design
description: Use this skill to generate well-branded interfaces and assets for Rezervame (a beauty & wellness booking platform for Panama), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Rezervame at a glance
- Beauty & wellness booking platform, customer web experience, Spanish (Panama).
- Feel: modern, clean, premium, friendly, elegant, trustworthy, easy to navigate.
- **Colors:** Prussian Blue `#023047` (headings, dark CTAs, prices) + Bittersweet Coral `#FF5757` (primary CTAs, logo, links, active, footer). Gold `#FDC700` for star ratings only.
- **Font:** Poppins (UI everything; self-hosted in assets/fonts/). Cocogoose Pro = logo wordmark only.
- **Logo:** always lowercase "rezervame" (assets/logos/ — color / black / white).
- Soft rounded shapes (cards 12–16px, pills for CTAs/tabs/chips), warm-neutral soft shadows, coral glow under primary CTAs. No emoji, no purple gradients.

## What's here
- `styles.css` — link this; it imports all tokens + fonts.
- `tokens/` — color, type, spacing, elevation custom properties.
- `assets/` — logos, Poppins fonts (self-hosted), brand/payment icons (`BrandIcon`).
- `components/` — React primitives (Button, ServiceCard, StaffCard, BusinessCard,
  Header, Footer, DateSelector, TimeSlotSelector, Modal, InvoiceTable, …).
- `ui_kits/customer-web/` — full click-through site (Home, Venue, Booking, Checkout, Account).
- `guidelines/` — foundation specimen cards.

## Using components
```html
<link rel="stylesheet" href="styles.css" />
<script src="_ds_bundle.js"></script>
<script>const { Button, ServiceCard } = window.RezervameDesignSystem_4317c4;</script>
```
For static mocks, copy the logos/fonts/icons you reference into your artifact folder
and reference them relatively. Match the voice (Spanish, "tú", uppercase eyebrows,
sentence-case titles) and the visual rules in README.md.
