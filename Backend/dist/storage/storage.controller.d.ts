import { S3StorageService } from './s3-storage.service';
export declare class StorageController {
    private readonly s3;
    constructor(s3: S3StorageService);
    uploadImage(body: {
        dataUrl?: string;
        folder?: string;
        fixedKey?: string;
    }): Promise<{
        url: string;
    }>;
}
