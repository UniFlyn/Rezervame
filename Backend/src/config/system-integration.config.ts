import type { PrismaService } from '../prisma.service';
import type { PostmarkEnvConfig } from '../email/postmark.config';
import { readPostmarkConfigFromEnv } from '../email/postmark.config';
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
