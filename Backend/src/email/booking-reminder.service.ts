import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { POSTMARK_TEMPLATE } from './email.constants';
import { EmailService } from './email.service';

const REMINDER_STATUSES = ['Approved', 'Paid', 'Rescheduled'];

function bookingCode(id: string, date: Date): string {
  return `RZV-${date.getFullYear()}-${id.slice(0, 4).toUpperCase()}`;
}

function formatDateEs(date: Date): string {
  return date.toLocaleDateString('es-PA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' });
}

@Injectable()
export class BookingReminderService {
  private readonly logger = new Logger(BookingReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Send 24h and 1h reminders. Call from Render cron or future BullMQ worker.
   * Requires migration `reminderSent24h` / `reminderSent1h` on Booking.
   */
  async processDueReminders(): Promise<{ sent24h: number; sent1h: number; skipped: boolean }> {
    if (!(await this.emailService.isConfigured())) {
      return { sent24h: 0, sent1h: 0, skipped: true };
    }

    const now = Date.now();
    const sent24h = await this.send24hReminders(now);
    const sent1h = await this.send1hReminders(now);
    return { sent24h, sent1h, skipped: false };
  }

  private async send24hReminders(now: number): Promise<number> {
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
      if (!email) continue;
      try {
        await this.emailService.sendWithTemplate({
          to: email,
          templateAlias: POSTMARK_TEMPLATE.BOOKING_REMINDER_24H,
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
      } catch (err) {
        this.logger.error(`24h reminder failed for booking ${b.id}`, err);
      }
    }
    return sent;
  }

  private async send1hReminders(now: number): Promise<number> {
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
      if (!email) continue;
      try {
        await this.emailService.sendWithTemplate({
          to: email,
          templateAlias: POSTMARK_TEMPLATE.BOOKING_REMINDER_1H,
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
      } catch (err) {
        this.logger.error(`1h reminder failed for booking ${b.id}`, err);
      }
    }
    return sent;
  }
}
