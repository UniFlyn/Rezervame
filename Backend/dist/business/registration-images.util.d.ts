import { S3StorageService } from '../storage/s3-storage.service';
export declare function persistRegistrationDetailsImages(registrationDetails: Record<string, unknown>, s3: S3StorageService): Promise<Record<string, unknown>>;
export declare function mergeRegistrationDetails(prev: unknown, patch: Record<string, unknown> | undefined): Record<string, unknown>;
