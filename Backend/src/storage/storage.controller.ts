import { BadRequestException, Body, Controller, Post, ServiceUnavailableException } from '@nestjs/common';
import { S3StorageService } from './s3-storage.service';

@Controller('api/storage')
export class StorageController {
  constructor(private readonly s3: S3StorageService) {}

  @Post('upload')
  async uploadImage(
    @Body() body: { dataUrl?: string; folder?: string },
  ): Promise<{ url: string }> {
    if (!this.s3.isConfigured()) {
      throw new ServiceUnavailableException(
        'S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME on the server.',
      );
    }
    const dataUrl = body.dataUrl?.trim();
    if (!dataUrl) {
      throw new BadRequestException('dataUrl is required');
    }
    const folder = (body.folder || 'uploads').trim();
    const url = await this.s3.uploadDataUrl(dataUrl, folder);
    return { url };
  }
}
