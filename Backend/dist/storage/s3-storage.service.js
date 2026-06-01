"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var S3StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageService = void 0;
exports.isOurS3ImageUrl = isOurS3ImageUrl;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto_1 = require("crypto");
const system_integration_config_1 = require("../config/system-integration.config");
const prisma_service_1 = require("../prisma.service");
const MAX_BYTES = 5 * 1024 * 1024;
function extFromContentType(contentType) {
    return contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
}
function isOurS3ImageUrl(url, cfg) {
    if (!cfg || !url?.trim())
        return false;
    const u = url.trim();
    if (u.startsWith(`${cfg.publicBaseUrl}/`))
        return true;
    if (u.includes(`${cfg.bucket}.s3.`) && u.includes(`/${cfg.uploadPrefix}/`))
        return true;
    return false;
}
let S3StorageService = S3StorageService_1 = class S3StorageService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(S3StorageService_1.name);
        this.client = null;
        this.clientKey = null;
    }
    async getCfg() {
        return (0, system_integration_config_1.resolveS3Config)(this.prisma);
    }
    async getClientPair() {
        const cfg = await this.getCfg();
        if (!cfg)
            return null;
        const fingerprint = `${cfg.region}:${cfg.bucket}:${cfg.accessKeyId}`;
        if (!this.client || this.clientKey !== fingerprint) {
            this.client = new client_s3_1.S3Client({
                region: cfg.region,
                credentials: {
                    accessKeyId: cfg.accessKeyId,
                    secretAccessKey: cfg.secretAccessKey,
                },
            });
            this.clientKey = fingerprint;
        }
        return { cfg, client: this.client };
    }
    async isConfigured() {
        return (await this.getCfg()) !== null;
    }
    async uploadBuffer(buffer, contentType, folder, ext) {
        const pair = await this.getClientPair();
        if (!pair) {
            throw new Error('S3 is not configured');
        }
        const { cfg, client } = pair;
        const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+/, '') || 'misc';
        const key = `${cfg.uploadPrefix}/${safeFolder}/${(0, crypto_1.randomUUID)()}.${ext}`;
        await client.send(new client_s3_1.PutObjectCommand({
            Bucket: cfg.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000',
        }));
        const url = `${cfg.publicBaseUrl}/${key}`;
        this.logger.log(`Uploaded s3://${cfg.bucket}/${key}`);
        return url;
    }
    async uploadJsonAtFixedKey(payload, keyUnderPrefix) {
        const pair = await this.getClientPair();
        if (!pair)
            return null;
        const { cfg, client } = pair;
        const safeKey = keyUnderPrefix.replace(/^\/+/, '').replace(/[^a-zA-Z0-9/_.-]/g, '');
        const key = `${cfg.uploadPrefix}/${safeKey}`;
        const body = Buffer.from(JSON.stringify(payload), 'utf8');
        await client.send(new client_s3_1.PutObjectCommand({
            Bucket: cfg.bucket,
            Key: key,
            Body: body,
            ContentType: 'application/json',
            CacheControl: 'public, max-age=60',
        }));
        const url = `${cfg.publicBaseUrl}/${key}`;
        this.logger.log(`Published public JSON s3://${cfg.bucket}/${key}`);
        return url;
    }
    async uploadDataUrl(dataUrl, folder = 'images') {
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
    async persistImageUrl(value, folder) {
        return this.migrateValueToS3(value, folder, { includeHttp: false });
    }
    async uploadFromHttpUrl(url, folder) {
        if (!(await this.getClientPair())) {
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
    async uploadFromHttpUrlToFixedKey(url, keyUnderPrefix) {
        const pair = await this.getClientPair();
        if (!pair) {
            throw new Error('S3 is not configured');
        }
        const { cfg, client } = pair;
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
        await client.send(new client_s3_1.PutObjectCommand({
            Bucket: cfg.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000',
        }));
        return `${cfg.publicBaseUrl}/${key}`;
    }
    async migrateValueToS3(value, folder, opts = {}) {
        if (!value?.trim())
            return null;
        const trimmed = value.trim();
        const cfg = await this.getCfg();
        if (cfg && isOurS3ImageUrl(trimmed, cfg)) {
            return trimmed;
        }
        if (trimmed.startsWith('data:image/')) {
            if (!(await this.isConfigured())) {
                this.logger.warn('S3 not configured — storing inline data URL in database');
                return trimmed;
            }
            try {
                return await this.uploadDataUrl(trimmed, folder);
            }
            catch (err) {
                this.logger.error('S3 upload failed', err);
                return trimmed;
            }
        }
        if (opts.includeHttp && /^https?:\/\//i.test(trimmed) && (await this.isConfigured())) {
            try {
                return await this.uploadFromHttpUrl(trimmed, folder);
            }
            catch (err) {
                this.logger.warn(`Could not mirror ${trimmed.slice(0, 60)}… — ${err}`);
                return trimmed;
            }
        }
        return trimmed;
    }
};
exports.S3StorageService = S3StorageService;
exports.S3StorageService = S3StorageService = S3StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], S3StorageService);
//# sourceMappingURL=s3-storage.service.js.map