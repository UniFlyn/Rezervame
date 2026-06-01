import { BadRequestException, Body, Controller, Post, ServiceUnavailableException } from '@nestjs/common';
import { S3StorageService } from './s3-storage.service';

@Controller('api/storage')
export class StorageController {
  constructor(private readonly s3: S3StorageService) {}

  @Post('upload')
  async uploadImage(
    @Body() body: { dataUrl?: string; folder?: string; fixedKey?: string },
  ): Promise<{ url: string }> {
    if (!(await this.s3.isConfigured())) {
      throw new ServiceUnavailableException(
        'S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME on the server.',
      );
    }
    const dataUrl = body.dataUrl?.trim();
    if (!dataUrl) {
      throw new BadRequestException('dataUrl is required');
    }
    const fixedKey = body.fixedKey?.trim();
    if (fixedKey === 'site-status.json') {
      const jsonMatch = /^data:application\/json;base64,(.+)$/s.exec(dataUrl);
      if (!jsonMatch) {
        throw new BadRequestException('site-status.json requires a JSON data URL');
      }
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(Buffer.from(jsonMatch[1], 'base64').toString('utf8')) as Record<
          string,
          unknown
        >;
      } catch {
        throw new BadRequestException('Invalid JSON for site-status.json');
      }
      const url = await this.s3.uploadJsonAtFixedKey(parsed, 'platform/site-status.json');
      if (!url) {
        throw new ServiceUnavailableException('Could not publish site-status.json to S3');
      }
      return { url };
    }
    const folder = (body.folder || 'uploads').trim();
    const url = await this.s3.uploadDataUrl(dataUrl, folder);
    return { url };
  }
}
