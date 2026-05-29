import s3Assets from "../../../shared/s3Assets.json";

export const S3_PUBLIC_BASE_URL = s3Assets.publicBaseUrl;

export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  ...s3Assets.defaultCategories,
};

export function defaultCategoryImageForKey(key: string): string {
  const k = key.trim();
  return DEFAULT_CATEGORY_IMAGES[k] ?? DEFAULT_CATEGORY_IMAGES[k.toLowerCase()] ?? "";
}
