export declare const S3_PUBLIC_BASE_URL: string;
export declare const S3_BUCKET: string;
export declare const DEFAULT_CATEGORY_IMAGE_BY_KEY: Record<string, string>;
export declare function defaultCategoryImageUrl(key: string): string | null;
export declare function isS3PublicUrl(url: string | null | undefined): boolean;
