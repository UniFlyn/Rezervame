-- Admin-managed email (Postmark), payments, and AWS S3 settings
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "stripePublishableKey" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "cashPayEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "cardPayEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "postmarkApiKey" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "postmarkFromEmail" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "postmarkReplyTo" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "postmarkMessageStream" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "postmarkWebhookToken" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "s3Region" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "s3BucketName" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "s3PublicBaseUrl" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "s3UploadPrefix" TEXT DEFAULT 'uploads';
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "s3AccessKeyId" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "s3SecretAccessKey" TEXT;
