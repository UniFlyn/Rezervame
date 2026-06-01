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
var EmailWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailWebhookController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const system_integration_config_1 = require("../config/system-integration.config");
let EmailWebhookController = EmailWebhookController_1 = class EmailWebhookController {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmailWebhookController_1.name);
    }
    async handlePostmarkWebhook(payload, webhookToken) {
        const cfg = await (0, system_integration_config_1.resolvePostmarkConfig)(this.prisma);
        if (cfg?.webhookToken) {
            if (webhookToken !== cfg.webhookToken) {
                throw new common_1.UnauthorizedException('Invalid Postmark webhook token');
            }
        }
        const recordType = payload.RecordType || 'Unknown';
        const email = (payload.Email || '').trim().toLowerCase();
        const messageId = payload.MessageID || '';
        this.logger.log(`Postmark webhook: ${recordType} ${email} ${messageId}`);
        try {
            await this.prisma.notificationDelivery.create({
                data: {
                    channel: 'email_webhook',
                    recipient: email || 'unknown',
                    subject: recordType,
                    body: JSON.stringify(payload).slice(0, 8000),
                    status: recordType.toLowerCase(),
                    meta: messageId || undefined,
                },
            });
        }
        catch {
        }
        switch (recordType) {
            case 'Bounce':
                await this.handleBounce(email, payload.Type || 'Unknown');
                break;
            case 'SpamComplaint':
                await this.handleSpamComplaint(email);
                break;
            case 'Delivery':
            case 'Open':
            case 'Click':
                break;
            default:
                break;
        }
        return { ok: true };
    }
    async handleBounce(email, bounceType) {
        if (!email)
            return;
        if (bounceType === 'HardBounce') {
            const user = await this.prisma.user.findUnique({ where: { email } });
            if (user && user.status === 'active') {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { status: 'email_bounced' },
                });
                this.logger.warn(`Marked user ${user.id} as email_bounced (${email})`);
            }
        }
    }
    async handleSpamComplaint(email) {
        if (!email)
            return;
        this.logger.warn(`Spam complaint from ${email}`);
    }
};
exports.EmailWebhookController = EmailWebhookController;
__decorate([
    (0, common_1.Post)('postmark'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-postmark-webhook-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EmailWebhookController.prototype, "handlePostmarkWebhook", null);
exports.EmailWebhookController = EmailWebhookController = EmailWebhookController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmailWebhookController);
//# sourceMappingURL=email-webhook.controller.js.map