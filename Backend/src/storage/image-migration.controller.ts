import {
  Controller,
  Headers,
  Post,
  Query,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ImageMigrationService } from './image-migration.service';

/**
 * One-time / repeat image migration to S3 (runs on Render where AWS keys exist).
 * POST https://rezervame.onrender.com/api/cron/migrate-images-s3
 * Header: Authorization: Bearer <CRON_SECRET>
 */
@Controller('api/cron')
export class ImageMigrationController {
  constructor(private readonly migration: ImageMigrationService) {}

  @Post('migrate-images-s3')
  async migrateImagesS3(
    @Headers('authorization') authorization?: string,
    @Query('includeHttp') includeHttp?: string,
    @Query('seedDefaults') seedDefaults?: string,
  ) {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('CRON_SECRET is not configured');
    }
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (token !== secret) {
      throw new UnauthorizedException('Invalid cron authorization');
    }

    return this.migration.migrateAll({
      includeHttp: includeHttp !== 'false',
      seedDefaults: seedDefaults !== 'false',
    });
  }
}
