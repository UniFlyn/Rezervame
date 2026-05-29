import { Injectable, Logger } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { readS3Config, type S3Config } from './s3.config';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — stay within free tier / reasonable uploads

function extFromContentType(contentType: string): string {
  return contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
}

/** True when URL already points at this project's S3 bucket/CDN. */
export function isOurS3ImageUrl(url: string, cfg: S3Config | null): boolean {
  if (!cfg || !url?.trim()) return false;
  const u = url.trim();
  if (u.startsWith(`${cfg.publicBaseUrl}/`)) return true;
  if (u.includes(`${cfg.bucket}.s3.`) && u.includes(`/${cfg.uploadPrefix}/`)) return true;
  return false;
}

@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private client: S3Client | null = null;

  isConfigured(): boolean {
    return readS3Config() !== null;
  }

  private getClient(): S3Client | null {
    const cfg = readS3Config();
    if (!cfg) return null;
    if (!this.client) {
      this.client = new S3Client({
        region: cfg.region,
        credentials: {
          accessKeyId: cfg.accessKeyId,
          secretAccessKey: cfg.secretAccessKey,
        },
      });
    }
    return this.client;
  }

  /** Upload raw buffer; returns public HTTPS URL. */
  async uploadBuffer(
    buffer: Buffer,
    contentType: string,
    folder: string,
    ext: string,
  ): Promise<string> {
    const cfg = readS3Config();
    const client = this.getClient();
    if (!cfg || !client) {
      throw new Error('S3 is not configured');
    }

    const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+/, '') || 'misc';
    const key = `${cfg.uploadPrefix}/${safeFolder}/${randomUUID()}.${ext}`;

    await client.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
      }),
    );

    const url = `${cfg.publicBaseUrl}/${key}`;
    this.logger.log(`Uploaded s3://${cfg.bucket}/${key}`);
    return url;
  }

  /** Parse data:image/...;base64,... and upload to S3. */
  async uploadDataUrl(dataUrl: string, folder = 'images'): Promise<string> {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(dataUrl.trim());
    if (!match) {
      throw new Error('Invalid data URL');
    }
    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > MAX_BYTES) {
      throw new Error(`Image too large (${buffer.length} bytes). Max ${MAX_BYTES}.`);
    }
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    return this.uploadBuffer(buffer, contentType, folder, ext);
  }

  /**
   * If value is a data-URL and S3 is configured, upload and return HTTPS URL.
   * Otherwise return trimmed value unchanged (http URLs, relative paths).
   */
  async persistImageUrl(value: string | null | undefined, folder: string): Promise<string | null> {
    return this.migrateValueToS3(value, folder, { includeHttp: false });
  }

  /** Fetch a remote image and upload to S3 (migration / optional backfill). */
  async uploadFromHttpUrl(url: string, folder: string): Promise<string> {
    const cfg = readS3Config();
    if (!cfg || !this.getClient()) {
      throw new Error('S3 is not configured');
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${url.slice(0, 80)}`);
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Not an image content-type: ${contentType}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      throw new Error(`Image too large (${buffer.length} bytes). Max ${MAX_BYTES}.`);
    }
    return this.uploadBuffer(buffer, contentType, folder, extFromContentType(contentType));
  }

  /** Upload remote image to a fixed key under uploadPrefix (e.g. defaults/categories/hairService.jpg). */
  async uploadFromHttpUrlToFixedKey(url: string, keyUnderPrefix: string): Promise<string> {
    const cfg = readS3Config();
    const client = this.getClient();
    if (!cfg || !client) {
      throw new Error('S3 is not configured');
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${url.slice(0, 80)}`);
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      throw new Error(`Image too large (${buffer.length} bytes). Max ${MAX_BYTES}.`);
    }
    const safeKey = keyUnderPrefix.replace(/^\/+/, '').replace(/[^a-zA-Z0-9/_.-]/g, '');
    const key = `${cfg.uploadPrefix}/${safeKey}`;
    await client.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
      }),
    );
    return `${cfg.publicBaseUrl}/${key}`;
  }

  /**
   * Upload data-URLs (and optionally external http(s) URLs) to S3.
   * Skips values already on our bucket. Unsplash photo IDs are left unchanged unless resolved to http.
   */
  async migrateValueToS3(
    value: string | null | undefined,
    folder: string,
    opts: { includeHttp?: boolean } = {},
  ): Promise<string | null> {
    if (!value?.trim()) return null;
    const trimmed = value.trim();
    const cfg = readS3Config();
    if (cfg && isOurS3ImageUrl(trimmed, cfg)) {
      return trimmed;
    }
    if (trimmed.startsWith('data:image/')) {
      if (!this.isConfigured()) {
        this.logger.warn('S3 not configured — storing inline data URL in database');
        return trimmed;
      }
      try {
        return await this.uploadDataUrl(trimmed, folder);
      } catch (err) {
        this.logger.error('S3 upload failed', err);
        return trimmed;
      }
    }
    if (opts.includeHttp && /^https?:\/\//i.test(trimmed) && this.isConfigured()) {
      try {
        return await this.uploadFromHttpUrl(trimmed, folder);
      } catch (err) {
        this.logger.warn(`Could not mirror ${trimmed.slice(0, 60)}… — ${err}`);
        return trimmed;
      }
    }
    return trimmed;
  }
}
