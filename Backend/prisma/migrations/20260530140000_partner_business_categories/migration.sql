-- Partner business types: dedicated Category rows for search & registration.
INSERT INTO "Category" ("id", "key", "labelEn", "labelEs", "sortOrder", "active", "imageUrl", "createdAt")
VALUES
  ('cat_partner_tattoo', 'tattoo', 'Tattoo studio', 'Estudio de tatuajes', 60, true, 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?q=80&w=600&fit=crop', NOW()),
  ('cat_partner_yoga', 'yoga', 'Yoga & fitness', 'Yoga y fitness', 65, true, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&fit=crop', NOW()),
  ('cat_partner_estetica', 'estetica', 'Aesthetics center', 'Centro de estética', 45, true, 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=600&fit=crop', NOW()),
  ('cat_partner_dermatology', 'dermatology', 'Dermatology / clinic', 'Dermatología / clínica', 47, true, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&fit=crop', NOW()),
  ('cat_partner_massage', 'massage', 'Massage', 'Masaje', 55, true, 'https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com/uploads/defaults/categories/massage.jpg', NOW())
ON CONFLICT ("key") DO UPDATE SET
  "labelEn" = EXCLUDED."labelEn",
  "labelEs" = EXCLUDED."labelEs",
  "sortOrder" = EXCLUDED."sortOrder",
  "active" = EXCLUDED."active",
  "imageUrl" = EXCLUDED."imageUrl";
