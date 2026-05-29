-- Massage category was created without an image URL; set a default hero for tiles.
UPDATE "Category"
SET "imageUrl" = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&fit=crop'
WHERE "key" IN ('Massage', 'massage')
  AND ("imageUrl" IS NULL OR TRIM("imageUrl") = '');
