"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStripeCheckoutForBookings = createStripeCheckoutForBookings;
exports.resolveStripeWebhookSecret = resolveStripeWebhookSecret;
const common_1 = require("@nestjs/common");
const stripe_util_1 = require("./stripe.util");
const booking_payment_util_1 = require("./booking-payment.util");
function webAppBaseUrl() {
    return (process.env.WEB_APP_URL?.trim() ||
        process.env.FRONTEND_URL?.trim() ||
        'http://localhost:3000').replace(/\/$/, '');
}
async function createStripeCheckoutForBookings(prisma, user, bookingIds) {
    const secretKey = await (0, stripe_util_1.resolveStripeSecretKey)(prisma);
    if (!secretKey) {
        throw new common_1.ServiceUnavailableException('Stripe is not configured on this server');
    }
    const bookings = await prisma.booking.findMany({
        where: { id: { in: bookingIds }, userId: user.id },
        include: { service: true, business: true },
    });
    if (bookings.length === 0)
        throw new common_1.BadRequestException('No valid bookings found');
    const payable = bookings.filter((b) => b.status !== 'Cancelled' && b.status !== 'Rejected' && b.status !== 'Completed');
    if (payable.length === 0) {
        throw new common_1.BadRequestException('All bookings are already completed or cancelled');
    }
    const commissionPercent = await (0, booking_payment_util_1.loadDefaultCommissionPercent)(prisma);
    const settlement = (0, booking_payment_util_1.calculateBookingSettlement)(payable, commissionPercent);
    const totalCents = Math.round(settlement.customerTotal * 100);
    if (totalCents < 50) {
        throw new common_1.BadRequestException('Payment amount is too small for card checkout');
    }
    const businessName = payable[0].business?.name || 'Rezervame booking';
    const lineDescription = payable
        .map((b) => b.service?.name || 'Service')
        .slice(0, 5)
        .join(', ');
    const stripe = (0, stripe_util_1.getStripeClient)(secretKey);
    const base = webAppBaseUrl();
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: user.email,
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: (process.env.STRIPE_CURRENCY || 'usd').toLowerCase(),
                    unit_amount: totalCents,
                    product_data: {
                        name: businessName,
                        description: lineDescription,
                    },
                },
            },
        ],
        success_url: `${base}/reservations/confirmation?paid=1&auto=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/reservations/confirmation?payment=cancelled`,
        metadata: {
            userId: user.id,
            bookingIds: JSON.stringify(payable.map((b) => b.id)),
        },
    });
    if (!session.url) {
        throw new common_1.ServiceUnavailableException('Stripe did not return a checkout URL');
    }
    await prisma.paymentCheckout.create({
        data: {
            stripeSessionId: session.id,
            userId: user.id,
            bookingIds: JSON.stringify(payable.map((b) => b.id)),
            amount: settlement.customerTotal,
            status: 'pending',
        },
    });
    return { url: session.url, sessionId: session.id };
}
async function resolveStripeWebhookSecret(prisma) {
    const fromEnv = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (fromEnv)
        return fromEnv;
    try {
        const config = await prisma.systemConfig.findUnique({ where: { id: 1 } });
        return config?.stripeWebhookSecret?.trim() || null;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=stripe-checkout.util.js.map