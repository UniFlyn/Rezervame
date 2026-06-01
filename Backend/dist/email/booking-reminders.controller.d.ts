import { BookingReminderService } from './booking-reminder.service';
export declare class BookingRemindersController {
    private readonly bookingReminders;
    constructor(bookingReminders: BookingReminderService);
    runBookingReminders(authorization?: string): Promise<{
        sent24h: number;
        sent1h: number;
        skipped: boolean;
    }>;
}
