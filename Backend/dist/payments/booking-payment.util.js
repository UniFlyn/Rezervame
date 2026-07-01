"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDefaultCommissionPercent = loadDefaultCommissionPercent;
exports.calculateBookingSettlement = calculateBookingSettlement;
exports.applyPaymentSettlement = applyPaymentSettlement;
exports.finalizeBookingGroupPayment = finalizeBookingGroupPayment;
exports.dedupeTransactionsByBookingGroup = dedupeTransactionsByBookingGroup;
exports.finalizeBusinessBookingGroupPayment = finalizeBusinessBookingGroupPayment;
const common_1 = require("@nestjs/common");
const notification_delivery_service_1 = require("../notifications/notification-delivery.service");
async function loadDefaultCommissionPercent(prisma) {
    try {
        const cfg = await prisma.systemConfig.findFirst({
            select: { defaultCommission: true },
        });
        const pct = cfg?.defaultCommission ?? 15;
        return Number.isFinite(pct) && pct >= 0 ? pct : 15;
    }
    catch {
        return 15;
    }
}
function calculateBookingSettlement(bookings, commissionPercent) {
    const grossSubtotal = bookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
    const totalTax = bookings.reduce((sum, b) => sum + Number(b.taxAmount || 0), 0);
    const pct = Number.isFinite(commissionPercent) && commissionPercent >= 0 ? commissionPercent : 15;
    const commissionAmount = Number((grossSubtotal * (pct / 100)).toFixed(2));
    const businessCredit = Number((grossSubtotal - commissionAmount).toFixed(2));
    const customerTotal = Number((grossSubtotal + totalTax + commissionAmount).toFixed(2));
    return { grossSubtotal, totalTax, commissionAmount, businessCredit, customerTotal };
}
async function creditPlatformCommission(tx, commissionAmount) {
    if (commissionAmount <= 0)
        return;
    await tx.systemConfig.upsert({
        where: { id: 1 },
        update: { platformBalance: { increment: commissionAmount } },
        create: { id: 1, platformBalance: commissionAmount },
    });
}
async function creditBusinessWallet(tx, businessId, settlement) {
    if (settlement.businessCredit <= 0 && settlement.grossSubtotal <= 0)
        return;
    await tx.business.update({
        where: { id: businessId },
        data: {
            balance: { increment: settlement.businessCredit },
            revenue: { increment: settlement.customerTotal },
        },
    });
}
async function applyPaymentSettlement(prisma, businessId, settlement) {
    await prisma.$transaction(async (tx) => {
        await creditBusinessWallet(tx, businessId, settlement);
        await creditPlatformCommission(tx, settlement.commissionAmount);
    });
}
async function finalizeBookingGroupPayment(prisma, user, bookingIds, paymentMethod) {
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
        throw new common_1.BadRequestException('bookingIds must be a non-empty array');
    }
    const bookings = await prisma.booking.findMany({
        where: { id: { in: bookingIds }, userId: user.id },
        include: {
            staff: true,
            business: true,
            service: true,
            user: { select: { id: true, email: true, name: true, phone: true, role: true } },
        },
    });
    if (bookings.length === 0)
        throw new common_1.BadRequestException('No valid bookings found');
    const payableBookings = bookings.filter((b) => b.status !== 'Cancelled' &&
        b.status !== 'Rejected' &&
        b.status !== 'Completed' &&
        b.status !== 'Paid' &&
        !b.transactionId);
    if (payableBookings.length === 0) {
        throw new common_1.BadRequestException('All bookings are already completed or paid');
    }
    const businessId = payableBookings[0].businessId;
    const commissionPercent = await loadDefaultCommissionPercent(prisma);
    const settlement = calculateBookingSettlement(payableBookings, commissionPercent);
    const staffNames = [...new Set(payableBookings.map((b) => b.staff?.name).filter(Boolean))].join(', ');
    const serviceNames = payableBookings.map((b) => b.service?.name || 'Service').join(', ');
    const result = await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
            data: {
                bookingId: payableBookings[0].id,
                businessId,
                amount: settlement.customerTotal,
                taxAmount: settlement.totalTax,
                commissionAmount: settlement.commissionAmount,
                status: 'Completed',
                paymentMethod,
                description: serviceNames,
                customerEmail: user.email,
                staffMember: staffNames || null,
                bookings: { connect: payableBookings.map((b) => ({ id: b.id })) },
            },
        });
        await tx.booking.updateMany({
            where: { id: { in: payableBookings.map((b) => b.id) } },
            data: { status: 'Paid', transactionId: transaction.id },
        });
        await creditBusinessWallet(tx, businessId, settlement);
        await creditPlatformCommission(tx, settlement.commissionAmount);
        await tx.notification.create({
            data: {
                userId: user.id,
                role: user.role,
                type: 'PAYMENT_COMPLETED',
                title: 'Payment received',
                body: `Your payment of $${settlement.customerTotal.toFixed(2)} was processed successfully.`,
            },
        });
        return transaction;
    });
    const biz = payableBookings[0].business;
    const amountLabel = `$${settlement.customerTotal.toFixed(2)}`;
    if (biz?.notifyBookingEmail && biz.email) {
        void (0, notification_delivery_service_1.sendPlatformEmail)(prisma, {
            to: biz.email,
            template: 'payment-received-business',
            model: { businessName: biz.name, amount: amountLabel },
        });
    }
    if (user.email) {
        void (0, notification_delivery_service_1.sendPlatformEmail)(prisma, {
            to: user.email,
            template: 'payment-receipt',
            model: {
                userName: user.name,
                customerName: user.name,
                amount: amountLabel,
                paymentMethod,
            },
        });
    }
    return {
        ok: true,
        transactionId: result.id,
        total: settlement.customerTotal,
        commissionAmount: settlement.commissionAmount,
        businessCredit: settlement.businessCredit,
    };
}
function dedupeTransactionsByBookingGroup(txList) {
    const byGroup = new Map();
    const standalone = [];
    for (const t of txList) {
        const gids = [
            ...new Set(t.bookings.map((b) => b.bookingGroupId?.trim()).filter((g) => Boolean(g))),
        ];
        if (gids.length === 1) {
            const gid = gids[0];
            const arr = byGroup.get(gid) ?? [];
            arr.push(t);
            byGroup.set(gid, arr);
        }
        else {
            standalone.push(t);
        }
    }
    const out = [...standalone];
    for (const groupTxs of byGroup.values()) {
        const best = groupTxs.reduce((a, b) => a.bookings.length >= b.bookings.length ? a : b);
        out.push(best);
    }
    return out.sort((a, b) => b.date.getTime() - a.date.getTime());
}
async function finalizeBusinessBookingGroupPayment(prisma, businessId, bookingIds, paymentMethod) {
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
        throw new common_1.BadRequestException('bookingIds must be a non-empty array');
    }
    const bookings = await prisma.booking.findMany({
        where: { id: { in: bookingIds }, businessId },
        include: {
            staff: true,
            service: true,
            user: { select: { id: true, email: true, name: true, phone: true, role: true } },
        },
    });
    if (bookings.length === 0)
        throw new common_1.BadRequestException('No valid bookings found');
    const payableBookings = bookings.filter((b) => b.status !== 'Cancelled' &&
        b.status !== 'Rejected' &&
        b.status !== 'Completed' &&
        b.status !== 'Paid' &&
        !b.transactionId);
    if (payableBookings.length === 0) {
        throw new common_1.BadRequestException('All bookings are already completed or paid');
    }
    const commissionPercent = await loadDefaultCommissionPercent(prisma);
    const settlement = calculateBookingSettlement(payableBookings, commissionPercent);
    const staffNames = [...new Set(payableBookings.map((b) => b.staff?.name).filter(Boolean))].join(', ');
    const serviceNames = payableBookings.map((b) => b.service?.name || 'Service').join(', ');
    return prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
            data: {
                bookingId: payableBookings[0].id,
                businessId,
                amount: settlement.customerTotal,
                taxAmount: settlement.totalTax,
                commissionAmount: settlement.commissionAmount,
                status: 'Completed',
                paymentMethod,
                description: serviceNames,
                customerEmail: payableBookings[0].user?.email || null,
                staffMember: staffNames || null,
                bookings: { connect: payableBookings.map((b) => ({ id: b.id })) },
            },
        });
        await tx.booking.updateMany({
            where: { id: { in: payableBookings.map((b) => b.id) } },
            data: { status: 'Paid', transactionId: transaction.id },
        });
        await creditBusinessWallet(tx, businessId, settlement);
        await creditPlatformCommission(tx, settlement.commissionAmount);
        return transaction;
    });
}
//# sourceMappingURL=booking-payment.util.js.map