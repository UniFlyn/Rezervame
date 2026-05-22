# Production Readiness Report

**Updated:** 2026-05-20  
**Scope:** Auth, payments, social login, Admin English UI, smoke tests

## Completed in this pass

| Area | Status | Notes |
|------|--------|-------|
| Password security | Done | bcrypt hashing on register, password change, business signup; legacy plaintext upgraded on login |
| Session tokens | Done | JWT (`JWT_SECRET`) with backward-compatible `token-{userId}` |
| Google sign-in | Done | Firebase popup on Web → `POST /auth/google` (requires `FIREBASE_*` on backend) |
| Stripe card payments | Done | Checkout Session + webhook; cash still via `pay-group` |
| Admin English-only UI | Done | Amenities & categories: single English label field; `labelEs` mirrored from `labelEn` for API |
| Smoke tests | Done | `scripts/smoke-production.mjs` |

## Configure before production

### Backend (`Backend/.env`)

```env
JWT_SECRET=<long-random-secret>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
WEB_APP_URL=https://rezervame-web.web.app
FIREBASE_PROJECT_ID=rezerveme-1fce5
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

1. Run `cd Backend && npm install && npx prisma db push && npm run prisma:seed`
2. Register Stripe webhook: `POST https://<api>/webhooks/stripe` → event `checkout.session.completed`
3. Enable Google provider in Firebase Console for the Web app

### Smoke test

```bash
API_BASE=http://localhost:4000 node scripts/smoke-production.mjs
```

## Still optional / not in scope

| Item | Notes |
|------|-------|
| Yappy (Panama) | No merchant API wired; use Stripe for card or cash via `pay-group` |
| Facebook login | Removed from customer modal; Google only |
| Mobile Stripe | Web redirects to Checkout; Mobile can call `pay-group/stripe-checkout` and open URL in browser |
| Full E2E (Playwright) | Smoke script covers API; browser E2E can be added later |

## Key endpoints

- `POST /auth/login` — JWT session
- `POST /auth/google` — `{ idToken }`
- `GET /public/payment-config`
- `POST /mobile/bookings/pay-group` — cash / in-person
- `POST /mobile/bookings/pay-group/stripe-checkout` — returns `{ url }`
- `POST /webhooks/stripe` — Stripe signature required

## Builds verified

Run after changes:

```bash
cd Backend && npm run build
cd Web && npm run build
cd Admin && npm run build
```
