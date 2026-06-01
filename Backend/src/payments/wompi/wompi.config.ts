import type { PrismaService } from '../../prisma.service';

export type WompiEnv = 'sandbox' | 'production';

export type WompiConfig = {
  publicKey: string;
  privateKey: string;
  env: WompiEnv;
  webhookSecret: string | null;
};

export function readWompiConfigFromEnv(): WompiConfig | null {
  const publicKey = process.env.WOMPI_PUBLIC_KEY?.trim();
  const privateKey = process.env.WOMPI_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  const envRaw = (process.env.WOMPI_ENV || 'sandbox').trim().toLowerCase();
  const env: WompiEnv = envRaw === 'production' ? 'production' : 'sandbox';
  return {
    publicKey,
    privateKey,
    env,
    webhookSecret: process.env.WOMPI_WEBHOOK_SECRET?.trim() || null,
  };
}

export type WompiConfigRow = {
  wompiEnabled?: boolean | null;
  cardPayEnabled?: boolean | null;
  wompiPublicKey?: string | null;
  wompiPrivateKey?: string | null;
  wompiEnv?: string | null;
  wompiWebhookSecret?: string | null;
};

export function isWompiEnabledFlag(row: WompiConfigRow | null | undefined): boolean {
  if (row?.wompiEnabled === false) return false;
  if (row?.cardPayEnabled === false) return false;
  return true;
}

export function resolveWompiConfigFromRow(row: WompiConfigRow | null | undefined): WompiConfig | null {
  const fromEnv = readWompiConfigFromEnv();
  if (fromEnv) return fromEnv;
  const publicKey = row?.wompiPublicKey?.trim();
  const privateKey = row?.wompiPrivateKey?.trim();
  if (!publicKey || !privateKey) return null;
  const envRaw = (row?.wompiEnv || 'sandbox').trim().toLowerCase();
  const env: WompiEnv = envRaw === 'production' ? 'production' : 'sandbox';
  return {
    publicKey,
    privateKey,
    env,
    webhookSecret: row?.wompiWebhookSecret?.trim() || null,
  };
}

export async function resolveWompiConfig(prisma: PrismaService): Promise<WompiConfig | null> {
  const row = await prisma.systemConfig.findUnique({ where: { id: 1 } });
  if (!row || !isWompiEnabledFlag(row)) return null;
  return resolveWompiConfigFromRow(row);
}

export function isWompiConfigured(row?: WompiConfigRow | null): boolean {
  return Boolean(resolveWompiConfigFromRow(row ?? null));
}
