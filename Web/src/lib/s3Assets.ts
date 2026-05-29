import s3Assets from "../../../shared/s3Assets.json";

export const S3_PUBLIC_BASE_URL = s3Assets.publicBaseUrl;

export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  ...s3Assets.defaultCategories,
};

export function isS3PublicUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const t = url.trim();
  return t.startsWith(S3_PUBLIC_BASE_URL) || t.includes(`${s3Assets.bucket}.s3.`);
}

export function defaultCategoryImageForKey(key: string): string {
  const k = key.trim();
  return DEFAULT_CATEGORY_IMAGES[k] ?? DEFAULT_CATEGORY_IMAGES[k.toLowerCase()] ?? "";
}
