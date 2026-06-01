import { PrismaService } from '../prisma.service';
import { S3StorageService } from './s3-storage.service';
export declare class ImageMigrationService {
    private readonly prisma;
    private readonly s3;
    private readonly logger;
    constructor(prisma: PrismaService, s3: S3StorageService);
    migrateAll(opts?: {
        includeHttp?: boolean;
        seedDefaults?: boolean;
    }): Promise<{
        uploaded: number;
        skipped: number;
        failed: number;
        defaultsSeeded: number;
    }>;
    private defaultCategoryUrl;
    private seedDefaultCategories;
    private migrateField;
}
