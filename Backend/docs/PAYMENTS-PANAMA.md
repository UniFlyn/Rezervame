# Panama payments — Wompi + Yappy (planned)

> **Status:** Merchant onboarding in progress. Implement module structure now; wire credentials when banks approve.

## Overview

| Provider | Use case | Docs |
|----------|----------|------|
| **Wompi Panama** (Banistmo) | Credit/debit — Visa, Mastercard, Clave | https://docs.wompi.co/docs/panama/ambientes-y-llaves |
| **Yappy** (Banco General) | Mobile wallet (most popular in Panama) | https://www.yappy.com.pa/comercial/desarrolladores/ |

Stripe remains in codebase for non-Panama / legacy; new checkout should prefer Wompi + Yappy when configured.

---

## Planned module layout

```
Backend/src/payments/
├── stripe-*.ts              # existing
├── wompi/
│   ├── wompi.config.ts      # pub_test_/prv_test_ vs pub_prod_/prv_prod_
│   ├── wompi.client.ts      # REST client (transactions, tokens)
│   ├── wompi-webhook.controller.ts
│   └── wompi-checkout.util.ts
├── yappy/
│   ├── yappy.config.ts      # merchantId + secretToken
│   ├── yappy.client.ts
│   ├── yappy-webhook.controller.ts
│   └── yappy-checkout.util.ts
└── payment-router.util.ts   # resolve provider from SystemConfig + booking context
```

---

## Environment variables (when credentials arrive)

```env
# Wompi Panama
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_ENV=sandbox          # sandbox | production
WOMPI_WEBHOOK_SECRET=

# Yappy
YAPPY_MERCHANT_ID=
YAPPY_SECRET_TOKEN=
YAPPY_ENV=sandbox          # sandbox | production
YAPPY_WEBHOOK_SECRET=
```

---

## Wompi Panama — integration notes

1. **Environments:** Sandbox keys only after Banistmo merchant account is created (`pub_test_` / `prv_test_`; production `pub_prod_` / `prv_prod_`).
2. **Flow:** Create payment intent → redirect or embedded widget → confirm via webhook (`transaction.updated`).
3. **Receipt email:** Use Postmark template `payment-receipt` with `transactionId`, `amount`, `paymentMethod: "Wompi"`.
4. **Never** store full card numbers — only last4 + Wompi reference in `Transaction` / booking metadata.

---

## Yappy — integration notes

1. Register as **comercial** with Banco General to receive `merchantId` + `secretToken`.
2. Typical flow: create payment request → customer approves in Yappy app → webhook confirms.
3. Map success to same `finalizeBookingGroupPayment` path as Wompi/Stripe where possible.
4. Receipt email: `paymentMethod: "Yappy"`.

---

## Webhooks

| Endpoint | Provider |
|----------|----------|
| `POST /webhooks/stripe` | Stripe (existing) |
| `POST /webhooks/wompi` | Wompi Panama |
| `POST /webhooks/yappy` | Yappy |

Verify signatures per provider docs before updating booking/transaction state.

---

## Admin / SystemConfig (future)

Extend `SystemConfig` or payment flags:

- `paymentsWompiEnabled`
- `paymentsYappyEnabled`
- `defaultPaymentProvider` (`wompi` | `yappy` | `stripe` | `pay_at_venue`)

---

## Implementation order (after credentials)

1. Wompi sandbox: charge + webhook + `payment-receipt` email  
2. Yappy sandbox: same  
3. Production keys + Render env  
4. Web/Mobile Payment Element / deep links  
5. Deprecate Stripe for Panama-only businesses (optional)
