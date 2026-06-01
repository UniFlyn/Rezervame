export type S3Config = {
    region: string;
    bucket: string;
    publicBaseUrl: string;
    uploadPrefix: string;
    accessKeyId: string;
    secretAccessKey: string;
};
export declare function readS3ConfigFromEnv(): S3Config | null;
export declare function readS3Config(): S3Config | null;
export declare function isS3Configured(): boolean;
