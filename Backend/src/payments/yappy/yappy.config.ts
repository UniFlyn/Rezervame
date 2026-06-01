import type { PrismaService } from '../../prisma.service';

export type YappyEnv = 'sandbox' | 'production';

export type YappyConfig = {
  merchantId: string;
  secretToken: string;
  env: YappyEnv;
};

export function readYappyConfigFromEnv(): YappyConfig | null {
  const merchantId = process.env.YAPPY_MERCHANT_ID?.trim();
  const secretToken = process.env.YAPPY_SECRET_TOKEN?.trim();
  if (!merchantId || !secretToken) return null;
  const envRaw = (process.env.YAPPY_ENV || 'sandbox').trim().toLowerCase();
  const env: YappyEnv = envRaw === 'production' ? 'production' : 'sandbox';
  return { merchantId, secretToken, env };
}

export type YappyConfigRow = {
  yappyEnabled?: boolean | null;
  yappyMerchantId?: string | null;
  yappySecretToken?: string | null;
};

export function resolveYappyConfigFromRow(row: YappyConfigRow | null | undefined): YappyConfig | null {
  const fromEnv = readYappyConfigFromEnv();
  if (fromEnv) return fromEnv;
  const merchantId = row?.yappyMerchantId?.trim();
  const secretToken = row?.yappySecretToken?.trim();
  if (!merchantId || !secretToken) return null;
  const envRaw = (process.env.YAPPY_ENV || 'sandbox').trim().toLowerCase();
  const env: YappyEnv = envRaw === 'production' ? 'production' : 'sandbox';
  return { merchantId, secretToken, env };
}

export async function resolveYappyConfig(prisma: PrismaService): Promise<YappyConfig | null> {
  const row = await prisma.systemConfig.findUnique({ where: { id: 1 } });
  if (!row || row.yappyEnabled === false) return null;
  return resolveYappyConfigFromRow(row);
}

export function isYappyConfigured(row?: YappyConfigRow | null): boolean {
  return Boolean(resolveYappyConfigFromRow(row ?? null));
}
