"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readS3ConfigFromEnv = readS3ConfigFromEnv;
exports.readS3Config = readS3Config;
exports.isS3Configured = isS3Configured;
function readS3ConfigFromEnv() {
    const bucket = process.env.S3_BUCKET_NAME?.trim();
    const region = process.env.AWS_REGION?.trim() || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
    if (!bucket || !accessKeyId || !secretAccessKey)
        return null;
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '') ||
        `https://${bucket}.s3.${region}.amazonaws.com`;
    return {
        region,
        bucket,
        publicBaseUrl,
        uploadPrefix: (process.env.S3_UPLOAD_PREFIX || 'uploads').replace(/^\/+|\/+$/g, ''),
        accessKeyId,
        secretAccessKey,
    };
}
function readS3Config() {
    return readS3ConfigFromEnv();
}
function isS3Configured() {
    return readS3ConfigFromEnv() !== null;
}
//# sourceMappingURL=s3.config.js.map