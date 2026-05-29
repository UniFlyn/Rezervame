import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailWebhookController } from './email-webhook.controller';
import { BookingReminderService } from './booking-reminder.service';
import { BookingRemindersController } from './booking-reminders.controller';

@Global()
@Module({
  controllers: [EmailWebhookController, BookingRemindersController],
  providers: [EmailService, BookingReminderService],
  exports: [EmailService, BookingReminderService],
})
export class EmailModule {}
