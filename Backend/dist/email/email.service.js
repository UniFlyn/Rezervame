"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
exports.postmarkSendRaw = postmarkSendRaw;
exports.postmarkSendWithTemplate = postmarkSendWithTemplate;
const common_1 = require("@nestjs/common");
const postmark = __importStar(require("postmark"));
const system_integration_config_1 = require("../config/system-integration.config");
const prisma_service_1 = require("../prisma.service");
let EmailService = EmailService_1 = class EmailService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmailService_1.name);
        this.client = null;
        this.clientKey = null;
    }
    async getClient() {
        const cfg = await (0, system_integration_config_1.resolvePostmarkConfig)(this.prisma);
        if (!cfg)
            return null;
        if (!this.client || this.clientKey !== cfg.apiKey) {
            this.client = new postmark.ServerClient(cfg.apiKey);
            this.clientKey = cfg.apiKey;
        }
        return this.client;
    }
    async isConfigured() {
        return (await (0, system_integration_config_1.resolvePostmarkConfig)(this.prisma)) !== null;
    }
    async sendWithTemplate(options) {
        const cfg = await (0, system_integration_config_1.resolvePostmarkConfig)(this.prisma);
        const client = await this.getClient();
        const to = options.to.trim();
        if (!cfg || !client || !to) {
            return { skipped: true };
        }
        try {
            const result = await client.sendEmailWithTemplate({
                From: options.from || cfg.fromEmail,
                To: to,
                ReplyTo: options.replyTo || cfg.replyTo,
                TemplateAlias: options.templateAlias,
                TemplateModel: options.templateModel,
                MessageStream: options.messageStream || cfg.messageStream,
            });
            this.logger.log(`Postmark template sent to ${to} | ${options.templateAlias} | ${result.MessageID}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Postmark template failed: ${options.templateAlias} → ${to}`, error);
            throw error;
        }
    }
    async sendRaw(options) {
        const cfg = await (0, system_integration_config_1.resolvePostmarkConfig)(this.prisma);
        const client = await this.getClient();
        const to = options.to.trim();
        if (!cfg || !client || !to) {
            return { skipped: true };
        }
        try {
            const result = await client.sendEmail({
                From: options.from || cfg.fromEmail,
                To: to,
                ReplyTo: options.replyTo || cfg.replyTo,
                Subject: options.subject,
                HtmlBody: options.htmlBody,
                TextBody: options.textBody || options.htmlBody.replace(/<[^>]+>/g, ' ').trim(),
                MessageStream: options.messageStream || cfg.messageStream,
            });
            this.logger.log(`Postmark raw sent to ${to} | ${options.subject} | ${result.MessageID}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Postmark raw failed: ${options.subject} → ${to}`, error);
            throw error;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmailService);
async function postmarkSendRaw(prisma, options) {
    return new EmailService(prisma).sendRaw(options);
}
async function postmarkSendWithTemplate(prisma, options) {
    return new EmailService(prisma).sendWithTemplate(options);
}
//# sourceMappingURL=email.service.js.map