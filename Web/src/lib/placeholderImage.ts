/** Neutral SVG placeholder when no venue/business image exists (no stock-photo URLs). */
export const PLACEHOLDER_IMAGE_DATA_URI =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect fill="#e2e8f0" width="800" height="600"/><text x="400" y="310" text-anchor="middle" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="22">No image</text></svg>`,
  );
