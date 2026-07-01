Five-step "Cómo funciona Rezervame" explainer for the Home page (and reusable elsewhere). Circular Lucide-style icons + coral step-number badges, horizontal on desktop with a subtle connector line, stacks on mobile.

```jsx
<HowItWorks />                 // default 5 steps, white
<HowItWorks variant="accent" />// soft coral wash
<HowItWorks compact />         // reduced vertical padding
```

Steps default to Descubre (search) · Reserva (calendar) · Confirma (checkCircle) · Disfruta (sparkles) · Califica (star). Override copy/icons via `steps`. Navy titles, coral accents, ≥12px text. Keep it as a helpful explainer, not a heavy marketing banner.
