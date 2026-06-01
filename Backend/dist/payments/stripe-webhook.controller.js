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
exports.StripeWebhookController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const booking_payment_util_1 = require("./booking-payment.util");
const stripe_util_1 = require("./stripe.util");
const stripe_checkout_util_1 = require("./stripe-checkout.util");
let StripeWebhookController = class StripeWebhookController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleStripe(req, signature) {
        const secretKey = await (0, stripe_util_1.resolveStripeSecretKey)(this.prisma);
        const webhookSecret = await (0, stripe_checkout_util_1.resolveStripeWebhookSecret)(this.prisma);
        if (!secretKey || !webhookSecret) {
            throw new common_1.ServiceUnavailableException('Stripe webhook is not configured');
        }
        if (!signature)
            throw new common_1.BadRequestException('Missing stripe-signature header');
        const rawBody = req.rawBody;
        if (!rawBody)
            throw new common_1.BadRequestException('Missing raw body for webhook verification');
        const stripe = (0, stripe_util_1.getStripeClient)(secretKey);
        let event;
        try {
            event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        }
        catch (err) {
            throw new common_1.BadRequestException(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'unknown'}`);
        }
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            if (session.payment_status !== 'paid') {
                return { received: true, skipped: 'not_paid' };
            }
            const checkout = await this.prisma.paymentCheckout.findUnique({
                where: { stripeSessionId: session.id },
            });
            if (!checkout || checkout.status === 'completed') {
                return { received: true, skipped: 'already_processed' };
            }
            const user = await this.prisma.user.findUnique({ where: { id: checkout.userId } });
            if (!user)
                return { received: true, skipped: 'no_user' };
            let bookingIds = [];
            try {
                bookingIds = JSON.parse(checkout.bookingIds);
            }
            catch {
                bookingIds = [];
            }
            if (bookingIds.length === 0 && session.metadata?.bookingIds) {
                try {
                    bookingIds = JSON.parse(session.metadata.bookingIds);
                }
                catch {
                    bookingIds = [];
                }
            }
            await (0, booking_payment_util_1.finalizeBookingGroupPayment)(this.prisma, user, bookingIds, 'Stripe');
            await this.prisma.paymentCheckout.update({
                where: { id: checkout.id },
                data: { status: 'completed', completedAt: new Date() },
            });
        }
        return { received: true };
    }
};
exports.StripeWebhookController = StripeWebhookController;
__decorate([
    (0, common_1.Post)('stripe'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StripeWebhookController.prototype, "handleStripe", null);
exports.StripeWebhookController = StripeWebhookController = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StripeWebhookController);
//# sourceMappingURL=stripe-webhook.controller.js.map