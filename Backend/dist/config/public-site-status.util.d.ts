import type { PrismaService } from '../prisma.service';
import type { S3StorageService } from '../storage/s3-storage.service';
export declare const SITE_STATUS_S3_KEY = "platform/site-status.json";
export type PublicSiteStatus = {
    maintenanceMode: boolean;
    platformBranding: string;
    updatedAt?: string;
};
export declare function publicSiteStatusFromRow(row: Record<string, unknown> | null | undefined): PublicSiteStatus;
export declare function publishPublicSiteStatus(prisma: PrismaService, s3: S3StorageService, row?: Record<string, unknown> | null): Promise<string | null>;
