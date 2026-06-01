-- Backfill display category labels from partner type / category keys for businesses registered before labels were stored.
UPDATE "Business" b
SET
  "categoryLabels" = ARRAY['Hair salon']::text[],
  "categoryLabel" = 'Hair salon'
WHERE
  (b."categoryLabels" IS NULL OR cardinality(b."categoryLabels") = 0)
  AND (b."categoryLabel" IS NULL OR trim(b."categoryLabel") = '')
  AND b."categoryKeys" @> ARRAY['hairService']::text[]
  AND NOT (b."categoryKeys" @> ARRAY['barber']::text[]);

UPDATE "Business" b
SET
  "categoryLabels" = ARRAY['Barbershop']::text[],
  "categoryLabel" = 'Barbershop'
WHERE
  (b."categoryLabels" IS NULL OR cardinality(b."categoryLabels") = 0)
  AND (b."categoryLabel" IS NULL OR trim(b."categoryLabel") = '')
  AND b."categoryKeys" @> ARRAY['barber']::text[];

UPDATE "Business" b
SET
  "categoryLabels" = ARRAY['Nail salon']::text[],
  "categoryLabel" = 'Nail salon'
WHERE
  (b."categoryLabels" IS NULL OR cardinality(b."categoryLabels") = 0)
  AND (b."categoryLabel" IS NULL OR trim(b."categoryLabel") = '')
  AND b."categoryKeys" @> ARRAY['nailCare']::text[];

UPDATE "Business" b
SET
  "categoryLabels" = ARRAY['Tattoo studio']::text[],
  "categoryLabel" = 'Tattoo studio'
WHERE
  (b."categoryLabels" IS NULL OR cardinality(b."categoryLabels") = 0)
  AND (b."categoryLabel" IS NULL OR trim(b."categoryLabel") = '')
  AND b."categoryKeys" @> ARRAY['tattoo']::text[];

UPDATE "Business" b
SET
  "categoryLabels" = ARRAY['Spa & massage']::text[],
  "categoryLabel" = 'Spa & massage'
WHERE
  (b."categoryLabels" IS NULL OR cardinality(b."categoryLabels") = 0)
  AND (b."categoryLabel" IS NULL OR trim(b."categoryLabel") = '')
  AND (b."categoryKeys" @> ARRAY['spaService']::text[] OR b."categoryKeys" @> ARRAY['massage']::text[]);

UPDATE "Business" b
SET
  "categoryLabels" = ARRAY['Aesthetics center']::text[],
  "categoryLabel" = 'Aesthetics center'
WHERE
  (b."categoryLabels" IS NULL OR cardinality(b."categoryLabels") = 0)
  AND (b."categoryLabel" IS NULL OR trim(b."categoryLabel") = '')
  AND b."categoryKeys" @> ARRAY['estetica']::text[];

UPDATE "Business" b
SET
  "categoryLabels" = ARRAY['Dermatology / clinic']::text[],
  "categoryLabel" = 'Dermatology / clinic'
WHERE
  (b."categoryLabels" IS NULL OR cardinality(b."categoryLabels") = 0)
  AND (b."categoryLabel" IS NULL OR trim(b."categoryLabel") = '')
  AND b."categoryKeys" @> ARRAY['dermatology']::text[];

UPDATE "Business" b
SET
  "categoryLabels" = ARRAY['Yoga & fitness']::text[],
  "categoryLabel" = 'Yoga & fitness'
WHERE
  (b."categoryLabels" IS NULL OR cardinality(b."categoryLabels") = 0)
  AND (b."categoryLabel" IS NULL OR trim(b."categoryLabel") = '')
  AND b."categoryKeys" @> ARRAY['yoga']::text[];
