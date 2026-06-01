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
exports.ImageMigrationController = void 0;
const common_1 = require("@nestjs/common");
const image_migration_service_1 = require("./image-migration.service");
let ImageMigrationController = class ImageMigrationController {
    constructor(migration) {
        this.migration = migration;
    }
    async migrateImagesS3(authorization, includeHttp, seedDefaults) {
        const secret = process.env.CRON_SECRET?.trim();
        if (!secret) {
            throw new common_1.ServiceUnavailableException('CRON_SECRET is not configured');
        }
        const token = authorization?.replace(/^Bearer\s+/i, '').trim();
        if (token !== secret) {
            throw new common_1.UnauthorizedException('Invalid cron authorization');
        }
        return this.migration.migrateAll({
            includeHttp: includeHttp !== 'false',
            seedDefaults: seedDefaults !== 'false',
        });
    }
};
exports.ImageMigrationController = ImageMigrationController;
__decorate([
    (0, common_1.Post)('migrate-images-s3'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('includeHttp')),
    __param(2, (0, common_1.Query)('seedDefaults')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ImageMigrationController.prototype, "migrateImagesS3", null);
exports.ImageMigrationController = ImageMigrationController = __decorate([
    (0, common_1.Controller)('api/cron'),
    __metadata("design:paramtypes", [image_migration_service_1.ImageMigrationService])
], ImageMigrationController);
//# sourceMappingURL=image-migration.controller.js.map