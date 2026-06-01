export type S3Config = {
  region: string;
  bucket: string;
  publicBaseUrl: string;
  uploadPrefix: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export function readS3ConfigFromEnv(): S3Config | null {
  const bucket = process.env.S3_BUCKET_NAME?.trim();
  const region = process.env.AWS_REGION?.trim() || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!bucket || !accessKeyId || !secretAccessKey) return null;

  const publicBaseUrl =
    process.env.S3_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '') ||
    `https://${bucket}.s3.${region}.amazonaws.com`;

  return {
    region,
    bucket,
    publicBaseUrl,
    uploadPrefix: (process.env.S3_UPLOAD_PREFIX || 'uploads').replace(/^\/+|\/+$/g, ''),
    accessKeyId,
    secretAccessKey,
  };
}

/** Env-only (sync). Prefer `resolveS3Config(prisma)` when DB overrides are needed. */
export function readS3Config(): S3Config | null {
  return readS3ConfigFromEnv();
}

export function isS3Configured(): boolean {
  return readS3ConfigFromEnv() !== null;
}
