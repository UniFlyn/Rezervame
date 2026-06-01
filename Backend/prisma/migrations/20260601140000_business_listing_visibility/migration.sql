-- Business listing visibility and profile setup gate for public discovery.
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "listingVisible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "profileSetupComplete" BOOLEAN NOT NULL DEFAULT false;

-- Existing active venues with core media + location may enable the visibility toggle (not auto-public).
UPDATE "Business"
SET
  "profileSetupComplete" = true
WHERE
  lower(trim("status")) = 'active'
  AND "logoUrl" IS NOT NULL
  AND trim("logoUrl") <> ''
  AND "bannerUrl" IS NOT NULL
  AND trim("bannerUrl") <> ''
  AND "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL
  AND length(trim(coalesce("description", ''))) >= 10
  AND "workingHours" IS NOT NULL
  AND trim("workingHours") <> '';
