import type { S3Config } from './s3.config';
import { PrismaService } from '../prisma.service';
export declare function isOurS3ImageUrl(url: string, cfg: S3Config | null): boolean;
export declare class S3StorageService {
    private readonly prisma;
    private readonly logger;
    private client;
    private clientKey;
    constructor(prisma: PrismaService);
    private getCfg;
    private getClientPair;
    isConfigured(): Promise<boolean>;
    uploadBuffer(buffer: Buffer, contentType: string, folder: string, ext: string): Promise<string>;
    uploadJsonAtFixedKey(payload: Record<string, unknown>, keyUnderPrefix: string): Promise<string | null>;
    uploadDataUrl(dataUrl: string, folder?: string): Promise<string>;
    persistImageUrl(value: string | null | undefined, folder: string): Promise<string | null>;
    uploadFromHttpUrl(url: string, folder: string): Promise<string>;
    uploadFromHttpUrlToFixedKey(url: string, keyUnderPrefix: string): Promise<string>;
    migrateValueToS3(value: string | null | undefined, folder: string, opts?: {
        includeHttp?: boolean;
    }): Promise<string | null>;
}
