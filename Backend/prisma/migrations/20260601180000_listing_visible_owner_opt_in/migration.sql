-- Public discovery requires an explicit merchant opt-in (listingVisible).
-- Undo the backfill that set listingVisible = true for all active businesses.
UPDATE "Business" SET "listingVisible" = false;

-- Keep profileSetupComplete aligned with required media (does not imply public listing).
UPDATE "Business"
SET "profileSetupComplete" = true
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
  AND trim("workingHours") <> ''
  AND cardinality("images") >= 1;
