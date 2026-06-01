# Panama payments — Wompi + Yappy + Pay by visit

Checkout uses **three methods only** (no Stripe in admin or customer UI):

| Method | Provider | Use case |
|--------|----------|----------|
| **Wompi** | Banistmo | Visa, Mastercard, Clave |
| **Yappy** | Banco General | Mobile wallet |
| **Pay by visit** | In-person | Customer pays at the venue |

## Admin configuration

**Admin → Settings → Payments** (or env vars on the API server):

- Wompi: public/private keys, `sandbox` \| `production`, webhook secret
- Yappy: `merchantId`, `secretToken`
- Toggles for each method + default commission

Env fallbacks (see `Backend/.env.example`):

```env
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_ENV=sandbox
WOMPI_WEBHOOK_SECRET=

YAPPY_MERCHANT_ID=
YAPPY_SECRET_TOKEN=
YAPPY_ENV=sandbox
```

## Public API

`GET /api/public/payment-config` returns:

- `methods[]` with ids: `wompi`, `yappy`, `pay_at_venue`
- `wompiPublicKey` / `wompiEnv` when Wompi is enabled and configured
- `yappyEnabled` when Yappy is enabled and configured

## Webhooks (stubs until credentials)

| Endpoint | Provider |
|----------|----------|
| `POST /webhooks/wompi` | Wompi Panama |
| `POST /webhooks/yappy` | Yappy |

Verify signatures per provider docs, then call `finalizeBookingGroupPayment`.

## Pay by visit flow

1. Customer selects **Pay by visit** at checkout (booking stores `paymentMethod: "Pay by visit"`).
2. Booking stays **Approved** until the business marks payment received (business panel).
3. `POST /mobile/bookings/pay-group` accepts **Pay by visit** (and legacy cash strings) only — not Wompi/Yappy (those use provider checkout when implemented).

## Wompi — docs

https://docs.wompi.co/docs/panama/ambientes-y-llaves

Sandbox: `pub_test_` / `prv_test_` — Production: `pub_prod_` / `prv_prod_`

## Yappy — docs

https://www.yappy.com.pa/comercial/desarrolladores/

Register as commercial client with Banco General for `merchantId` + `secretToken`.

## Module layout

```
Backend/src/payments/
├── payment-config.util.ts
├── booking-payment.util.ts
├── wompi/
│   ├── wompi.config.ts
│   └── wompi-webhook.controller.ts
└── yappy/
    ├── yappy.config.ts
    └── yappy-webhook.controller.ts
```

Stripe files remain for legacy data only; new integrations should use Wompi/Yappy.
