import s3Assets from "../../../shared/s3Assets.json";

export const S3_PUBLIC_BASE_URL = s3Assets.publicBaseUrl;

export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  ...s3Assets.defaultCategories,
};

/** Legacy hostname from early S3 setup docs — objects live on the current bucket with the same key. */
const LEGACY_S3_HOSTS = [
  "rezervame-assets-yourname.s3.ap-southeast-2.amazonaws.com",
  "rezervame-assets-yourname.s3.amazonaws.com",
];

export function normalizePublicImageUrl(url: string | null | undefined): string {
  const raw = (url ?? "").trim();
  if (!raw) return "";
  let s = raw;
  let correctHost: string;
  try {
    correctHost = new URL(S3_PUBLIC_BASE_URL.replace(/\/+$/, "")).host;
  } catch {
    correctHost = `${s3Assets.bucket}.s3.ap-southeast-2.amazonaws.com`;
  }
  for (const legacy of LEGACY_S3_HOSTS) {
    if (s.includes(legacy)) s = s.split(legacy).join(correctHost);
  }
  if (s.includes("rezervame-assets-yourname")) {
    s = s.replace(/rezervame-assets-yourname/g, s3Assets.bucket);
  }
  // S3 keys are case-sensitive; lowercase massage.jpg was never uploaded.
  if (s.includes("/defaults/categories/massage.jpg")) {
    s = s.replace("/defaults/categories/massage.jpg", "/defaults/categories/Massage.jpg");
  }
  return s;
}

export function isS3PublicUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const t = normalizePublicImageUrl(url);
  return t.startsWith(S3_PUBLIC_BASE_URL) || t.includes(`${s3Assets.bucket}.s3.`);
}

export function defaultCategoryImageForKey(key: string): string {
  const k = key.trim();
  return DEFAULT_CATEGORY_IMAGES[k] ?? DEFAULT_CATEGORY_IMAGES[k.toLowerCase()] ?? "";
}
