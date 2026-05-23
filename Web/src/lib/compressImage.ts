export type CompressImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  maxBytes?: number;
  mimeType?: string;
  quality?: number;
};

const DEFAULT_MAX_BYTES = 280_000;

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
      reject(new Error('Unable to read image'));
    };
    img.src = url;
  });
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): string {
  if (mimeType === 'image/png') {
    return canvas.toDataURL('image/png');
  }
  return canvas.toDataURL('image/jpeg', quality);
}

function drawScaled(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
): HTMLCanvasElement {
  let { width, height } = img;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.max(1, Math.round(width * ratio));
  height = Math.max(1, Math.round(height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/** Resize/compress an image file to a data URL safe for API storage. */
export async function compressImageFile(
  file: File,
  opts: CompressImageOptions = {},
): Promise<string> {
  const maxWidth = opts.maxWidth ?? 1200;
  const maxHeight = opts.maxHeight ?? 1200;
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const mimeType = opts.mimeType ?? 'image/jpeg';
  let quality = opts.quality ?? 0.88;

  const img = await loadImageFromFile(file);
  let canvas = drawScaled(img, maxWidth, maxHeight);
  let dataUrl = canvasToDataUrl(canvas, mimeType, quality);

  while (dataUrl.length > maxBytes && quality > 0.45) {
    quality -= 0.08;
    dataUrl = canvasToDataUrl(canvas, mimeType, quality);
  }

  if (dataUrl.length > maxBytes) {
    const smaller = drawScaled(img, Math.round(maxWidth * 0.7), Math.round(maxHeight * 0.7));
    canvas = smaller;
    quality = 0.82;
    dataUrl = canvasToDataUrl(canvas, mimeType, quality);
    while (dataUrl.length > maxBytes && quality > 0.4) {
      quality -= 0.1;
      dataUrl = canvasToDataUrl(canvas, mimeType, quality);
    }
  }

  if (dataUrl.length > maxBytes) {
    throw new Error('Image is too large. Try a smaller photo.');
  }

  return dataUrl;
}
