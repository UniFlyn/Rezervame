Primary action element for Rezervame — coral for the main CTA, navy for secondary emphasis, outline for repeated in-card actions.

```jsx
<Button variant="primary" shape="pill" leftIcon="calendar">Reservar ahora</Button>
<Button variant="dark">Ir al inicio</Button>
<Button variant="outline" uppercase>Rezervame</Button>
```

Variants: `primary` (coral, subtle lift), `dark` (Prussian navy), `outline` (coral border — use for "REZERVAME" / "VER DISPONIBILIDAD"), `soft` (coral tint — **chips/filters/badges & low-emphasis secondary actions only, e.g. "Promociones"; never a main booking CTA**), `ghost`. Sizes `sm|md|lg` (radius 10/12/14). `shape="pill"` for hero CTAs (Buscar, Reservar Ahora), `shape="rounded"` (default) in-content. Props: `fullWidth`, `uppercase` (subtle 0.3px tracking), `leftIcon`/`rightIcon` (Glyph name or node), `loading`, `disabled`.

**Interaction states (all booking CTAs).** Both `primary` and `outline` resolve to a filled brand-red look on interaction: `outline` is white at rest, then **fills solid #FF5757 with white text on hover** and **#D83B3B (pressed) with a slight scale**; `primary` darkens #FF5757 → #F04646 (hover) → #D83B3B (press). `disabled` is neutral-200 fill / neutral-400 text, `not-allowed`, no shadow. This is driven entirely inside the component — every consumer (ServiceCard "Rezervame", StaffCard "Ver disponibilidad", sticky-bar "Reservar ahora", booking, checkout, confirmation modals) inherits it automatically.
