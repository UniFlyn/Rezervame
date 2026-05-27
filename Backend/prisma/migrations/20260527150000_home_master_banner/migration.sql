-- Add Web+Mobile shared home hero/master banner fields
ALTER TABLE "SystemConfig"
  ADD COLUMN IF NOT EXISTS "homeHeroEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "homeHeroTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "homeHeroSubtitle" TEXT,
  ADD COLUMN IF NOT EXISTS "homeHeroDealText" TEXT,
  ADD COLUMN IF NOT EXISTS "homeHeroImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "homeHeroCtaText" TEXT,
  ADD COLUMN IF NOT EXISTS "homeHeroCtaUrl" TEXT;

