-- Panama gateways: Wompi (cards) + Yappy; Stripe fields retained but unused in admin UI.
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "wompiEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "wompiPublicKey" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "wompiPrivateKey" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "wompiEnv" TEXT DEFAULT 'sandbox';
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "wompiWebhookSecret" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "yappySecretToken" TEXT;
