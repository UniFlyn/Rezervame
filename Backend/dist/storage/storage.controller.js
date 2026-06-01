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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageController = void 0;
const common_1 = require("@nestjs/common");
const s3_storage_service_1 = require("./s3-storage.service");
let StorageController = class StorageController {
    constructor(s3) {
        this.s3 = s3;
    }
    async uploadImage(body) {
        if (!(await this.s3.isConfigured())) {
            throw new common_1.ServiceUnavailableException('S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME on the server.');
        }
        const dataUrl = body.dataUrl?.trim();
        if (!dataUrl) {
            throw new common_1.BadRequestException('dataUrl is required');
        }
        const fixedKey = body.fixedKey?.trim();
        if (fixedKey === 'site-status.json') {
            const jsonMatch = /^data:application\/json;base64,(.+)$/s.exec(dataUrl);
            if (!jsonMatch) {
                throw new common_1.BadRequestException('site-status.json requires a JSON data URL');
            }
            let parsed;
            try {
                parsed = JSON.parse(Buffer.from(jsonMatch[1], 'base64').toString('utf8'));
            }
            catch {
                throw new common_1.BadRequestException('Invalid JSON for site-status.json');
            }
            const url = await this.s3.uploadJsonAtFixedKey(parsed, 'platform/site-status.json');
            if (!url) {
                throw new common_1.ServiceUnavailableException('Could not publish site-status.json to S3');
            }
            return { url };
        }
        const folder = (body.folder || 'uploads').trim();
        const url = await this.s3.uploadDataUrl(dataUrl, folder);
        return { url };
    }
};
exports.StorageController = StorageController;
__decorate([
    (0, common_1.Post)('upload'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "uploadImage", null);
exports.StorageController = StorageController = __decorate([
    (0, common_1.Controller)('api/storage'),
    __metadata("design:paramtypes", [s3_storage_service_1.S3StorageService])
], StorageController);
//# sourceMappingURL=storage.controller.js.map