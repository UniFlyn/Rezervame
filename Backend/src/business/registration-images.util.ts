import { S3StorageService } from '../storage/s3-storage.service';

function asRecord(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  return json as Record<string, unknown>;
}

async function persistOne(
  s3: S3StorageService,
  value: unknown,
  folder: string,
): Promise<string | null> {
  if (typeof value !== 'string' || !value.trim()) return null;
  return s3.persistImageUrl(value.trim(), folder);
}

async function persistList(
  s3: S3StorageService,
  values: unknown,
  folder: string,
): Promise<string[]> {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  for (const raw of values.slice(0, 16)) {
    const url = await persistOne(s3, raw, folder);
    if (url) out.push(url);
  }
  return out;
}

/** Upload data-URL / remote images inside partner registration JSON before saving. */
export async function persistRegistrationDetailsImages(
  registrationDetails: Record<string, unknown>,
  s3: S3StorageService,
): Promise<Record<string, unknown>> {
  const out = { ...registrationDetails };
  const exterior = await persistOne(s3, out.exteriorPhotoUrl, 'venues/gallery');
  if (exterior) out.exteriorPhotoUrl = exterior;
  const bankProof = await persistOne(s3, out.bankProofUrl, 'documents/bank');
  if (bankProof) out.bankProofUrl = bankProof;
  const interior = await persistList(s3, out.interiorPhotoUrls, 'venues/gallery');
  if (interior.length) out.interiorPhotoUrls = interior;
  const portfolio = await persistList(s3, out.portfolioPhotoUrls, 'venues/gallery');
  if (portfolio.length) out.portfolioPhotoUrls = portfolio;
  return out;
}

export function mergeRegistrationDetails(
  prev: unknown,
  patch: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const base = asRecord(prev) ?? {};
  if (!patch) return { ...base };
  return { ...base, ...patch };
}
