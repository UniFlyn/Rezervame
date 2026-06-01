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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const s3_config_1 = require("./storage/s3.config");
function sanitizeDbError(err) {
    const msg = err instanceof Error ? err.message : String(err);
    return msg
        .replace(/postgresql:\/\/[^\s'"]+/gi, 'postgresql://***')
        .replace(/\/\/[^@\s]+@/g, '//***@')
        .slice(0, 240);
}
let HealthController = class HealthController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    root() {
        return { ok: true, service: 'rezervame-backend', basePath: '/api' };
    }
    apiRoot() {
        return { ok: true, service: 'rezervame-backend', basePath: '/api' };
    }
    async v1Health(res) {
        const checks = {
            api: 'ok',
            postgres: 'unknown',
            redis: process.env.REDIS_URL ? 'configured' : 'not_configured',
            s3: (0, s3_config_1.isS3Configured)() ? 'ok' : 'not_configured',
        };
        let postgresDetail;
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            checks.postgres = 'ok';
        }
        catch (err) {
            checks.postgres = 'error';
            postgresDetail =
                sanitizeDbError(err) ||
                    this.prisma.lastConnectError ||
                    'Database unreachable. Check DATABASE_URL on Render and Neon project status.';
        }
        const healthy = checks.postgres === 'ok';
        const payload = {
            ok: healthy,
            service: 'rezervame-backend',
            path: '/api/v1/health',
            checks,
            timestamp: new Date().toISOString(),
            databaseConfigured: Boolean(process.env.DATABASE_URL?.trim()),
        };
        if (postgresDetail) {
            payload.postgresError = postgresDetail;
        }
        if (!healthy) {
            res.status(503);
        }
        return payload;
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "root", null);
__decorate([
    (0, common_1.Get)('api'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "apiRoot", null);
__decorate([
    (0, common_1.Get)('api/v1/health'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "v1Health", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthController);
//# sourceMappingURL=health.controller.js.map