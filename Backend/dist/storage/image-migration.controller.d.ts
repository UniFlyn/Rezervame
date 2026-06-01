import { ImageMigrationService } from './image-migration.service';
export declare class ImageMigrationController {
    private readonly migration;
    constructor(migration: ImageMigrationService);
    migrateImagesS3(authorization?: string, includeHttp?: string, seedDefaults?: string): Promise<{
        uploaded: number;
        skipped: number;
        failed: number;
        defaultsSeeded: number;
    }>;
}
