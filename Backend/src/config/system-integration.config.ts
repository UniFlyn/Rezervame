import type { PrismaService } from '../prisma.service';
import type { PostmarkEnvConfig } from '../email/postmark.config';
import { readPostmarkConfigFromEnv } from '../email/postmark.config';
import type { WompiConfig } from '../payments/wompi/wompi.config';
import { readWompiConfigFromEnv } from '../payments/wompi/wompi.config';
import type { YappyConfig } from '../payments/yappy/yappy.config';
import { readYappyConfigFromEnv } from '../payments/yappy/yappy.config';
import type { S3Config } from '../storage/s3.config';
import { readS3ConfigFromEnv } from '../storage/s3.config';

export type SystemConfigIntegrations = {
  postmarkApiKey?: string | null;
  postmarkFromEmail?: string | null;
  postmarkReplyTo?: string | null;
  postmarkMessageStream?: string | null;
  postmarkWebhookToken?: string | null;
  stripeApiKey?: string | null;
  stripePublishableKey?: string | null;
  stripeWebhookSecret?: string | null;
  s3Region?: string | null;
  s3BucketName?: string | null;
  s3PublicBaseUrl?: string | null;
  s3UploadPrefix?: string | null;
  s3AccessKeyId?: string | null;
  s3SecretAccessKey?: string | null;
  wompiEnabled?: boolean | null;
  wompiPublicKey?: string | null;
  wompiPrivateKey?: string | null;
  wompiEnv?: string | null;
  wompiWebhookSecret?: string | null;
  yappyEnabled?: boolean | null;
  yappyMerchantId?: string | null;
  yappySecretToken?: string | null;
  cashPayEnabled?: boolean | null;
  cardPayEnabled?: boolean | null;
};

export function resolvePostmarkConfigFromRow(
  row: SystemConfigIntegrations | null | undefined,
): PostmarkEnvConfig | null {
  const fromEnv = readPostmarkConfigFromEnv();
  if (fromEnv) return fromEnv;
  const apiKey = row?.postmarkApiKey?.trim();
  if (!apiKey) return null;
  const r = row!;
  return {
    apiKey,
    fromEmail: r.postmarkFromEmail?.trim() || 'noreply@rezervame.com',
    replyTo: r.postmarkReplyTo?.trim() || 'soporte@rezervame.com',
    messageStream: r.postmarkMessageStream?.trim() || 'outbound',
    webhookToken: r.postmarkWebhookToken?.trim() || null,
  };
}

export async function resolvePostmarkConfig(
  prisma: PrismaService,
): Promise<PostmarkEnvConfig | null> {
  const row = await prisma.systemConfig.findUnique({ where: { id: 1 } });
  return resolvePostmarkConfigFromRow(row);
}

export function resolveS3ConfigFromRow(
  row: SystemConfigIntegrations | null | undefined,
): S3Config | null {
  const fromEnv = readS3ConfigFromEnv();
  if (fromEnv) return fromEnv;

  const bucket = row?.s3BucketName?.trim();
  const accessKeyId = row?.s3AccessKeyId?.trim();
  const secretAccessKey = row?.s3SecretAccessKey?.trim();
  if (!bucket || !accessKeyId || !secretAccessKey) return null;

  const r = row!;
  const region = r.s3Region?.trim() || 'us-east-1';
  const publicBaseUrl =
    r.s3PublicBaseUrl?.trim().replace(/\/+$/, '') ||
    `https://${bucket}.s3.${region}.amazonaws.com`;

  return {
    region,
    bucket,
    publicBaseUrl,
    uploadPrefix: (r.s3UploadPrefix?.trim() || 'uploads').replace(/^\/+|\/+$/g, ''),
    accessKeyId,
    secretAccessKey,
  };
}

export async function resolveS3Config(prisma: PrismaService): Promise<S3Config | null> {
  const row = await prisma.systemConfig.findUnique({ where: { id: 1 } });
  return resolveS3ConfigFromRow(row);
}

export async function resolveStripePublishableKey(prisma: PrismaService): Promise<string> {
  const fromEnv = process.env.STRIPE_PUBLISHABLE_KEY?.trim();
  if (fromEnv) return fromEnv;
  const row = await prisma.systemConfig.findUnique({ where: { id: 1 } });
  return row?.stripePublishableKey?.trim() || '';
}

function setAdminConfigIfEmpty(
  target: Record<string, unknown>,
  key: string,
  value: string | undefined | null,
): void {
  if (!value?.trim()) return;
  if (String(target[key] ?? '').trim()) return;
  target[key] = value.trim();
}

/** Fill empty SystemConfig fields from server env so Admin → AWS S3 shows live Render/local values. */
export function adminConfigWithEnvFallbacks(
  row: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(row || {}) };

  const s3 = readS3ConfigFromEnv();
  if (s3) {
    setAdminConfigIfEmpty(out, 's3Region', s3.region);
    setAdminConfigIfEmpty(out, 's3BucketName', s3.bucket);
    setAdminConfigIfEmpty(out, 's3PublicBaseUrl', s3.publicBaseUrl);
    setAdminConfigIfEmpty(out, 's3UploadPrefix', s3.uploadPrefix);
    setAdminConfigIfEmpty(out, 's3AccessKeyId', s3.accessKeyId);
    setAdminConfigIfEmpty(out, 's3SecretAccessKey', s3.secretAccessKey);
  }

  const postmark = readPostmarkConfigFromEnv();
  if (postmark) {
    setAdminConfigIfEmpty(out, 'postmarkApiKey', postmark.apiKey);
    setAdminConfigIfEmpty(out, 'postmarkFromEmail', postmark.fromEmail);
    setAdminConfigIfEmpty(out, 'postmarkReplyTo', postmark.replyTo);
    setAdminConfigIfEmpty(out, 'postmarkMessageStream', postmark.messageStream);
    setAdminConfigIfEmpty(out, 'postmarkWebhookToken', postmark.webhookToken ?? undefined);
  }

  const wompi = readWompiConfigFromEnv();
  if (wompi) {
    setAdminConfigIfEmpty(out, 'wompiPublicKey', wompi.publicKey);
    setAdminConfigIfEmpty(out, 'wompiPrivateKey', wompi.privateKey);
    setAdminConfigIfEmpty(out, 'wompiEnv', wompi.env);
    setAdminConfigIfEmpty(out, 'wompiWebhookSecret', wompi.webhookSecret ?? undefined);
  }

  const yappy = readYappyConfigFromEnv();
  if (yappy) {
    setAdminConfigIfEmpty(out, 'yappyMerchantId', yappy.merchantId);
    setAdminConfigIfEmpty(out, 'yappySecretToken', yappy.secretToken);
  }

  if (out.wompiEnabled === undefined || out.wompiEnabled === null) {
    out.wompiEnabled = out.cardPayEnabled !== false;
  }
  if (out.yappyEnabled === undefined || out.yappyEnabled === null) {
    out.yappyEnabled = true;
  }
  if (out.cashPayEnabled === undefined || out.cashPayEnabled === null) {
    out.cashPayEnabled = true;
  }
  if (!String(out.wompiEnv ?? '').trim()) {
    out.wompiEnv = 'sandbox';
  }

  return out;
}
