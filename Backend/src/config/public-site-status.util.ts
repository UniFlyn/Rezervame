import type { PrismaService } from '../prisma.service';
import type { S3StorageService } from '../storage/s3-storage.service';

export const SITE_STATUS_S3_KEY = 'platform/site-status.json';

export type PublicSiteStatus = {
  maintenanceMode: boolean;
  platformBranding: string;
  updatedAt?: string;
};

export function publicSiteStatusFromRow(
  row: Record<string, unknown> | null | undefined,
): PublicSiteStatus {
  const branding =
    typeof row?.platformBranding === 'string' && row.platformBranding.trim()
      ? row.platformBranding.trim()
      : 'Rezervame';
  return {
    maintenanceMode: row?.maintenanceMode === true,
    platformBranding: branding,
    updatedAt: new Date().toISOString(),
  };
}

/** Mirror visitor maintenance flag to public S3 JSON (read by Web when API is not deployed yet). */
export async function publishPublicSiteStatus(
  prisma: PrismaService,
  s3: S3StorageService,
  row?: Record<string, unknown> | null,
): Promise<string | null> {
  let source = row;
  if (!source) {
    const cfg = await prisma.systemConfig.findUnique({ where: { id: 1 } });
    source = (cfg ?? {}) as Record<string, unknown>;
  }
  const payload = publicSiteStatusFromRow(source);
  return s3.uploadJsonAtFixedKey(payload, SITE_STATUS_S3_KEY);
}
