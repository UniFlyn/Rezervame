/** Web home hero — wide banner (matches ~min(360px, 52vh) cover on desktop). */
export const HOME_BANNER_MAX_WIDTH = 1920;
export const HOME_BANNER_MAX_HEIGHT = 800;
export const HOME_BANNER_ASPECT = 2.4;
export const HOME_BANNER_JPEG_QUALITY = 0.88;
export const HOME_BANNER_MAX_BYTES = 600 * 1024;

export type PreparedHeroImage = {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
};

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image file"));
    };
    img.src = url;
  });
}

/** Resize & compress for S3 upload — keeps aspect ratio within max bounds. */
export async function prepareHomeBannerImage(file: File): Promise<PreparedHeroImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a JPEG, PNG, or WebP image");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Image is too large (max 12 MB before processing)");
  }

  const img = await loadImageFromFile(file);
  let { width, height } = img;

  const scale = Math.min(1, HOME_BANNER_MAX_WIDTH / width, HOME_BANNER_MAX_HEIGHT / height);
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.drawImage(img, 0, 0, width, height);

  let quality = HOME_BANNER_JPEG_QUALITY;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  let bytes = Math.ceil((dataUrl.length * 3) / 4);

  while (bytes > HOME_BANNER_MAX_BYTES && quality > 0.5) {
    quality -= 0.06;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    bytes = Math.ceil((dataUrl.length * 3) / 4);
  }

  if (bytes > HOME_BANNER_MAX_BYTES) {
    throw new Error("Image is still too large after compression — try a smaller source file");
  }

  return { dataUrl, width, height, bytes };
}
