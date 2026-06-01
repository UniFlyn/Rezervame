import s3Assets from '../config/s3-assets.json';

/** Legacy S3 hostnames written before the production bucket name was finalized. */
const LEGACY_S3_HOSTS = [
  'rezervame-assets-yourname.s3.ap-southeast-2.amazonaws.com',
  'rezervame-assets-yourname.s3.amazonaws.com',
];

/**
 * Rewrites stored image URLs that still point at a retired bucket hostname.
 * Objects were uploaded under the same key prefix on the current bucket.
 */
export function normalizePublicImageUrl(url: string | null | undefined): string | null {
  if (url == null || typeof url !== 'string') return null;
  let s = url.trim();
  if (!s) return null;

  const publicBase = s3Assets.publicBaseUrl.replace(/\/+$/, '');
  let correctHost: string;
  try {
    correctHost = new URL(publicBase).host;
  } catch {
    correctHost = `${s3Assets.bucket}.s3.ap-southeast-2.amazonaws.com`;
  }

  for (const legacy of LEGACY_S3_HOSTS) {
    if (s.includes(legacy)) {
      s = s.split(legacy).join(correctHost);
    }
  }
  if (s.includes('rezervame-assets-yourname')) {
    s = s.replace(/rezervame-assets-yourname/g, s3Assets.bucket);
  }
  return s;
}
