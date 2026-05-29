import {
  Controller,
  Headers,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { BookingReminderService } from './booking-reminder.service';

/**
 * Protected cron endpoint for booking email reminders.
 * Render cron: POST https://rezervame.onrender.com/api/cron/booking-reminders
 * Header: Authorization: Bearer <CRON_SECRET>
 */
@Controller('api/cron')
export class BookingRemindersController {
  constructor(private readonly bookingReminders: BookingReminderService) {}

  @Post('booking-reminders')
  async runBookingReminders(@Headers('authorization') authorization?: string) {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('CRON_SECRET is not configured');
    }
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (token !== secret) {
      throw new UnauthorizedException('Invalid cron authorization');
    }

    return this.bookingReminders.processDueReminders();
  }
}
