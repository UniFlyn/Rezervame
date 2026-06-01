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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_url_1 = require("./database-url");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor() {
        (0, database_url_1.normalizeDatabaseUrl)();
        super();
        this.lastConnectError = null;
    }
    async onModuleInit() {
        const attempts = 3;
        for (let i = 0; i < attempts; i++) {
            try {
                await this.$connect();
                this.lastConnectError = null;
                return;
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                this.lastConnectError = msg.replace(/postgresql:\/\/[^\s]+/gi, 'postgresql://***');
                console.error(`[Prisma] Database connection failed (attempt ${i + 1}/${attempts}):`, this.lastConnectError);
                if (i < attempts - 1) {
                    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
                }
            }
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map