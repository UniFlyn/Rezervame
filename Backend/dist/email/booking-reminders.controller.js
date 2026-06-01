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
exports.BookingRemindersController = void 0;
const common_1 = require("@nestjs/common");
const booking_reminder_service_1 = require("./booking-reminder.service");
let BookingRemindersController = class BookingRemindersController {
    constructor(bookingReminders) {
        this.bookingReminders = bookingReminders;
    }
    async runBookingReminders(authorization) {
        const secret = process.env.CRON_SECRET?.trim();
        if (!secret) {
            throw new common_1.ServiceUnavailableException('CRON_SECRET is not configured');
        }
        const token = authorization?.replace(/^Bearer\s+/i, '').trim();
        if (token !== secret) {
            throw new common_1.UnauthorizedException('Invalid cron authorization');
        }
        return this.bookingReminders.processDueReminders();
    }
};
exports.BookingRemindersController = BookingRemindersController;
__decorate([
    (0, common_1.Post)('booking-reminders'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingRemindersController.prototype, "runBookingReminders", null);
exports.BookingRemindersController = BookingRemindersController = __decorate([
    (0, common_1.Controller)('api/cron'),
    __metadata("design:paramtypes", [booking_reminder_service_1.BookingReminderService])
], BookingRemindersController);
//# sourceMappingURL=booking-reminders.controller.js.map