Global customer header with two variants: **`home`** (logo · search · "Iniciar sesión") for the logged-out landing, and **`business`** (default — logo · search · centered business name/category · notifications · favourites · user + reservation count) for venue/booking/checkout/account. Zones are evenly distributed with flexible spacers so the business info sits centrally with no awkward middle gap.

```jsx
// Home (logged out)
<Header variant="home" logoSrc="/assets/logos/rezervame-color.png" onLogin={() => {}} />

// Business / commerce
<Header logoSrc="/assets/logos/rezervame-color.png" notifications
  user={{ name: 'Richard Lucas', reservations: 152, avatar }}
  contextTitle="Luxe Hair Studio" contextSubtitle="Categoría: Servicios para el cabello" />
```

Pass `logoSrc` (the coral wordmark PNG). `showSearch={false}` to hide the search. The "{n} RESERVAS" accent renders in coral. `onLogin`/`loginLabel` drive the home login button.
