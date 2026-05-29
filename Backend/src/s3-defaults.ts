import s3Assets from './config/s3-assets.json';

export const S3_PUBLIC_BASE_URL = s3Assets.publicBaseUrl;
export const S3_BUCKET = s3Assets.bucket;

export const DEFAULT_CATEGORY_IMAGE_BY_KEY: Record<string, string> = {
  ...s3Assets.defaultCategories,
};

export function defaultCategoryImageUrl(key: string): string | null {
  const k = (key || '').trim();
  return DEFAULT_CATEGORY_IMAGE_BY_KEY[k] ?? DEFAULT_CATEGORY_IMAGE_BY_KEY[k.toLowerCase()] ?? null;
}

export function isS3PublicUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return url.trim().startsWith(S3_PUBLIC_BASE_URL) || url.includes(`${S3_BUCKET}.s3.`);
}
