Service line-item card for a venue's service list — title, description, duration meta, price and an outline CTA.

```jsx
<ServiceCard selected name="Corte de cabello para mujer"
  description="Corte y peinado profesional adaptado a tus preferencias"
  duration="60 min" price="65" onAction={book} />
```

`selected` switches the border + title + duration to coral (the "currently chosen" service). Price renders bold Prussian-blue with the `currency` prefix ("$"). `actionLabel` defaults to "Rezervame" (uppercase outline button).
