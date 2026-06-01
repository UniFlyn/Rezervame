"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCancellationPolicy = normalizeCancellationPolicy;
exports.formatCancellationPolicyMessage = formatCancellationPolicyMessage;
exports.canCustomerCancelBooking = canCustomerCancelBooking;
exports.assertCustomerCanCancelBooking = assertCustomerCanCancelBooking;
exports.attachCancellationMeta = attachCancellationMeta;
const common_1 = require("@nestjs/common");
function normalizeCancellationPolicy(business) {
    const allowed = business?.cancellationAllowed !== false;
    const raw = business?.cancellationHoursBefore;
    const hoursBefore = typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 24;
    return { allowed, hoursBefore };
}
function formatCancellationPolicyMessage(policy, lang = 'en') {
    if (!policy.allowed) {
        return lang === 'es'
            ? 'Este negocio no permite cancelaciones.'
            : 'This business does not allow cancellations.';
    }
    if (policy.hoursBefore <= 0) {
        return lang === 'es'
            ? 'Puedes cancelar en cualquier momento antes de tu cita.'
            : 'You may cancel anytime before your appointment.';
    }
    return lang === 'es'
        ? `Las cancelaciones deben hacerse ${policy.hoursBefore}h antes de tu cita.`
        : `Cancellations must be done ${policy.hoursBefore}h before your appointment.`;
}
function canCustomerCancelBooking(booking, business, now = new Date()) {
    const status = String(booking.status || '');
    if (status === 'Completed' || status === 'Cancelled' || status === 'Rejected') {
        return {
            allowed: false,
            code: 'terminal_status',
            message: 'This booking can no longer be cancelled.',
        };
    }
    const isPendingUnpaid = status === 'Pending' && !booking.transactionId;
    if (isPendingUnpaid) {
        return {
            allowed: true,
            code: 'pending_free',
            message: 'You may cancel before the venue accepts your booking.',
        };
    }
    const policy = normalizeCancellationPolicy(business);
    if (!policy.allowed) {
        return {
            allowed: false,
            code: 'not_allowed',
            message: 'This business does not allow cancellations.',
        };
    }
    const appointmentAt = new Date(booking.date);
    if (Number.isNaN(appointmentAt.getTime())) {
        return { allowed: true, code: 'allowed', message: 'Cancellation is allowed.' };
    }
    if (policy.hoursBefore > 0) {
        const deadline = new Date(appointmentAt.getTime() - policy.hoursBefore * 60 * 60 * 1000);
        if (now.getTime() > deadline.getTime()) {
            return {
                allowed: false,
                code: 'too_late',
                message: `Cancellations must be made at least ${policy.hoursBefore} hours before the appointment.`,
            };
        }
    }
    return { allowed: true, code: 'allowed', message: 'Cancellation is allowed.' };
}
function assertCustomerCanCancelBooking(booking, business, now) {
    const check = canCustomerCancelBooking(booking, business, now);
    if (!check.allowed) {
        throw new common_1.BadRequestException(check.message);
    }
}
function attachCancellationMeta(row, business) {
    const policy = normalizeCancellationPolicy(business);
    const check = canCustomerCancelBooking({
        status: String(row.status ?? ''),
        date: row.date,
        transactionId: row.transactionId ?? null,
    }, business);
    return {
        ...row,
        cancellationPolicy: policy,
        cancellationPolicyMessageEn: formatCancellationPolicyMessage(policy, 'en'),
        cancellationPolicyMessageEs: formatCancellationPolicyMessage(policy, 'es'),
        canCancel: check.allowed,
        ...(check.allowed ? {} : { cancelBlockReason: check.message }),
    };
}
//# sourceMappingURL=cancellation-policy.util.js.map