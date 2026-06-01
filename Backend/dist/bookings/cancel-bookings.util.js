"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBookingsForCustomer = cancelBookingsForCustomer;
exports.enrichBookingCancellationFields = enrichBookingCancellationFields;
const common_1 = require("@nestjs/common");
const cancellation_policy_util_1 = require("./cancellation-policy.util");
const booking_payment_util_1 = require("../payments/booking-payment.util");
const notification_delivery_service_1 = require("../notifications/notification-delivery.service");
async function reverseSettlement(tx, businessId, settlement) {
    if (settlement.businessCredit > 0) {
        await tx.business.update({
            where: { id: businessId },
            data: {
                balance: { decrement: settlement.businessCredit },
                revenue: { decrement: settlement.customerTotal },
            },
        });
    }
    if (settlement.commissionAmount > 0) {
        await tx.systemConfig.upsert({
            where: { id: 1 },
            update: { platformBalance: { decrement: settlement.commissionAmount } },
            create: { id: 1, platformBalance: 0 },
        });
    }
}
async function reversePaidBookings(prisma, bookings) {
    const paid = bookings.filter((b) => b.transactionId);
    if (paid.length === 0)
        return;
    const commissionPercent = await (0, booking_payment_util_1.loadDefaultCommissionPercent)(prisma);
    const byTx = new Map();
    for (const b of paid) {
        const tid = b.transactionId;
        const arr = byTx.get(tid) ?? [];
        arr.push(b);
        byTx.set(tid, arr);
    }
    for (const [transactionId, cancelling] of byTx.entries()) {
        const businessId = cancelling[0].businessId;
        const settlement = (0, booking_payment_util_1.calculateBookingSettlement)(cancelling, commissionPercent);
        await prisma.$transaction(async (tx) => {
            await reverseSettlement(tx, businessId, settlement);
            const allLinked = await tx.booking.findMany({
                where: { transactionId },
                select: { id: true, status: true },
            });
            const cancellingIds = new Set(cancelling.map((b) => b.id));
            const stillActive = allLinked.filter((b) => !cancellingIds.has(b.id) && b.status !== 'Cancelled' && b.status !== 'Rejected');
            await tx.booking.updateMany({
                where: { id: { in: cancelling.map((b) => b.id) } },
                data: { status: 'Cancelled' },
            });
            if (stillActive.length === 0) {
                await tx.transaction.update({
                    where: { id: transactionId },
                    data: { status: 'Refunded' },
                });
            }
            else {
                const txRow = await tx.transaction.findUnique({ where: { id: transactionId } });
                const nextAmount = Math.max(0, Number((txRow?.amount ?? 0) - settlement.customerTotal));
                await tx.transaction.update({
                    where: { id: transactionId },
                    data: {
                        status: 'Partially Refunded',
                        amount: nextAmount,
                        commissionAmount: Math.max(0, Number((txRow?.commissionAmount ?? 0) - settlement.commissionAmount)),
                        taxAmount: Math.max(0, Number((txRow?.taxAmount ?? 0) - settlement.totalTax)),
                    },
                });
            }
        });
    }
}
async function cancelBookingsForCustomer(prisma, userId, bookingIds) {
    if (!bookingIds.length) {
        throw new common_1.BadRequestException('bookingIds must be a non-empty array');
    }
    const bookings = await prisma.booking.findMany({
        where: { id: { in: bookingIds }, userId },
        include: { business: true, transaction: true, user: true },
    });
    if (bookings.length === 0) {
        throw new common_1.BadRequestException('No valid bookings found');
    }
    for (const b of bookings) {
        (0, cancellation_policy_util_1.assertCustomerCanCancelBooking)(b, b.business);
    }
    const cancellable = bookings.filter((b) => b.status !== 'Completed' &&
        b.status !== 'Cancelled' &&
        b.status !== 'Rejected');
    if (cancellable.length === 0) {
        throw new common_1.BadRequestException('No cancellable bookings in this group');
    }
    const unpaid = cancellable.filter((b) => !b.transactionId);
    const paid = cancellable.filter((b) => b.transactionId);
    if (unpaid.length > 0) {
        await prisma.booking.updateMany({
            where: { id: { in: unpaid.map((b) => b.id) } },
            data: { status: 'Cancelled' },
        });
    }
    if (paid.length > 0) {
        await reversePaidBookings(prisma, paid);
    }
    const biz = cancellable[0].business;
    if (biz.notifyCancellationEmail && biz.email) {
        void (0, notification_delivery_service_1.sendEmail)(prisma, biz.email, `[Rezervame] Booking cancelled`, `<p>A customer cancelled ${cancellable.length} booking(s) at ${biz.name}.</p>`);
    }
    const userEmail = cancellable[0].user?.email;
    if (userEmail) {
        void (0, notification_delivery_service_1.sendEmail)(prisma, userEmail, `[Rezervame] Your booking was cancelled`, `<p>Your cancellation at ${biz.name} was processed successfully.</p>`);
    }
    return { cancelled: cancellable.length };
}
function enrichBookingCancellationFields(row) {
    const business = row.business ?? null;
    const check = (0, cancellation_policy_util_1.canCustomerCancelBooking)({
        status: String(row.status ?? ''),
        date: row.date,
        transactionId: row.transactionId ?? null,
    }, business);
    const policy = {
        allowed: business?.cancellationAllowed !== false,
        hoursBefore: typeof business?.cancellationHoursBefore === 'number'
            ? business.cancellationHoursBefore
            : 24,
    };
    return {
        ...row,
        cancellationPolicy: policy,
        canCancel: check.allowed,
        cancelBlockReason: check.allowed ? null : check.message,
    };
}
//# sourceMappingURL=cancel-bookings.util.js.map