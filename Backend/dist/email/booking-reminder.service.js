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
var BookingReminderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingReminderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const email_constants_1 = require("./email.constants");
const email_service_1 = require("./email.service");
const REMINDER_STATUSES = ['Approved', 'Paid', 'Rescheduled'];
function bookingCode(id, date) {
    return `RZV-${date.getFullYear()}-${id.slice(0, 4).toUpperCase()}`;
}
function formatDateEs(date) {
    return date.toLocaleDateString('es-PA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
function formatTime(date) {
    return date.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' });
}
let BookingReminderService = BookingReminderService_1 = class BookingReminderService {
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.logger = new common_1.Logger(BookingReminderService_1.name);
    }
    async processDueReminders() {
        if (!(await this.emailService.isConfigured())) {
            return { sent24h: 0, sent1h: 0, skipped: true };
        }
        const now = Date.now();
        const sent24h = await this.send24hReminders(now);
        const sent1h = await this.send1hReminders(now);
        return { sent24h, sent1h, skipped: false };
    }
    async send24hReminders(now) {
        const min = new Date(now + 23 * 60 * 60 * 1000);
        const max = new Date(now + 25 * 60 * 60 * 1000);
        const bookings = await this.prisma.booking.findMany({
            where: {
                date: { gte: min, lte: max },
                status: { in: REMINDER_STATUSES },
                reminderSent24h: false,
            },
            include: {
                user: { select: { email: true, name: true } },
                business: { select: { name: true, address: true } },
                service: { select: { name: true } },
            },
            take: 100,
        });
        let sent = 0;
        for (const b of bookings) {
            const email = b.user.email?.trim();
            if (!email)
                continue;
            try {
                await this.emailService.sendWithTemplate({
                    to: email,
                    templateAlias: email_constants_1.POSTMARK_TEMPLATE.BOOKING_REMINDER_24H,
                    templateModel: {
                        customerName: b.customerName || b.user.name,
                        bookingCode: bookingCode(b.id, b.date),
                        businessName: b.business.name,
                        serviceName: b.service?.name || 'Appointment',
                        date: formatDateEs(b.date),
                        time: formatTime(b.date),
                        address: b.business.address || '',
                    },
                });
                await this.prisma.booking.update({
                    where: { id: b.id },
                    data: { reminderSent24h: true },
                });
                sent += 1;
            }
            catch (err) {
                this.logger.error(`24h reminder failed for booking ${b.id}`, err);
            }
        }
        return sent;
    }
    async send1hReminders(now) {
        const min = new Date(now + 50 * 60 * 1000);
        const max = new Date(now + 70 * 60 * 1000);
        const bookings = await this.prisma.booking.findMany({
            where: {
                date: { gte: min, lte: max },
                status: { in: REMINDER_STATUSES },
                reminderSent1h: false,
            },
            include: {
                user: { select: { email: true, name: true } },
                business: { select: { name: true } },
            },
            take: 100,
        });
        let sent = 0;
        for (const b of bookings) {
            const email = b.user.email?.trim();
            if (!email)
                continue;
            try {
                await this.emailService.sendWithTemplate({
                    to: email,
                    templateAlias: email_constants_1.POSTMARK_TEMPLATE.BOOKING_REMINDER_1H,
                    templateModel: {
                        customerName: b.customerName || b.user.name,
                        bookingCode: bookingCode(b.id, b.date),
                        businessName: b.business.name,
                        time: formatTime(b.date),
                    },
                });
                await this.prisma.booking.update({
                    where: { id: b.id },
                    data: { reminderSent1h: true },
                });
                sent += 1;
            }
            catch (err) {
                this.logger.error(`1h reminder failed for booking ${b.id}`, err);
            }
        }
        return sent;
    }
};
exports.BookingReminderService = BookingReminderService;
exports.BookingReminderService = BookingReminderService = BookingReminderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], BookingReminderService);
//# sourceMappingURL=booking-reminder.service.js.map