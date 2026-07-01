Base login / sign-up modal for Rezervame — email-first with a Google option. Triggered from the Home header's "Iniciar sesión" button. Not a full auth flow.

```jsx
const [open, setOpen] = React.useState(false);
const [loading, setLoading] = React.useState(false);
<Header variant="home" logoSrc={logo} onLogin={() => setOpen(true)} />
<LoginModal
  open={open}
  logoSrc={logo}
  loading={loading}
  onSubmit={(email) => { setLoading(true); /* … */ }}
  onGoogle={() => {}}
  onClose={() => setOpen(false)}
/>
```

States: **default**, **loading** (`loading` → spinner CTA + disabled inputs), **error** (invalid email validated locally, or pass `error="…"`), **disabled** (Continuar is disabled while the email is empty). Responsive padding collapses on mobile. Composes the DS Button / Input / IconButton / BrandIcon — keep it consistent with the header and the rest of the system.
