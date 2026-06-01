-- Hide duplicate legacy Massage row; partner filters use `massage` only.
UPDATE "Category"
SET "active" = false
WHERE "key" = 'Massage'
  AND EXISTS (SELECT 1 FROM "Category" c2 WHERE c2."key" = 'massage' AND c2."active" = true);
