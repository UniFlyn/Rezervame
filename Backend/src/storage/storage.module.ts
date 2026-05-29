import { Global, Module } from '@nestjs/common';
import { S3StorageService } from './s3-storage.service';
import { StorageController } from './storage.controller';
import { ImageMigrationService } from './image-migration.service';
import { ImageMigrationController } from './image-migration.controller';

@Global()
@Module({
  controllers: [StorageController, ImageMigrationController],
  providers: [S3StorageService, ImageMigrationService],
  exports: [S3StorageService, ImageMigrationService],
})
export class StorageModule {}
