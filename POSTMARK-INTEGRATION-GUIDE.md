# Postmark Integration Guide — Rezervame

> **Project:** Rezervame  
> **Domain:** rezervame.com  
> **Email Provider:** Postmark (ActiveCampaign)  
> **Backend:** NestJS + TypeScript  
> **Status:** Domain verified, ready for backend integration

---

## 1. DNS Configuration (Already Done ✅)

The domain `rezervame.com` is fully configured and verified in Postmark:

| Record | Type | Status |
|--------|------|--------|
| DKIM (DomainKeys Identified Mail) | TXT | ✅ Verified |
| Return-Path / SPF | CNAME → `pm.mtasv.net` | ✅ Verified |
| DMARC | TXT (`v=DMARC1; p=none`) | ✅ Verified |

**No DNS action needed from you.** This is already set up.

---

## 2. Sending Addresses

| Address | Use | Reply-To |
|---------|-----|----------|
| `noreply@rezervame.com` | Confirmations, reminders, cancellations, receipts | `soporte@rezervame.com` |
| `soporte@rezervame.com` | Communications requiring user reply | — |
| `notificaciones@rezervame.com` | System alerts, payment notices, no-shows | `soporte@rezervame.com` |

---

## 3. Message Streams

| Stream | ID | Use |
|--------|----|-----|
| **Transactional** | `outbound` | Booking confirmations, reminders, cancellations, payment receipts, password resets, email verification |
| **Broadcast** | `broadcast` (future) | Newsletters, promotions — not needed for MVP |

All MVP traffic goes through the `outbound` stream.

---

## 4. Backend Integration (NestJS)

### 4.1 Installation

```bash
npm install postmark
```

### 4.2 Environment Variables

```env
# .env
POSTMARK_API_KEY=8bdcdc6a-c4cb-420f-a622-b1c270fca238
POSTMARK_FROM_EMAIL=noreply@rezervame.com
POSTMARK_REPLY_TO=soporte@rezervame.com
POSTMARK_MESSAGE_STREAM=outbound
```


### 4.3 Module Structure

```
src/
└── email/
    ├── email.module.ts
    ├── email.service.ts
    ├── email.constants.ts
    ├── email-webhook.controller.ts
    ├── interfaces/
    │   └── email-options.interface.ts
    └── templates/
        └── (Postmark template IDs)
```

### 4.4 EmailService

```typescript
// src/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as postmark from 'postmark';

@Injectable()
export class EmailService {
  private readonly client: postmark.ServerClient;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly replyTo: string;
  private readonly messageStream: string;

  constructor(private readonly config: ConfigService) {
    this.client = new postmark.ServerClient(
      this.config.getOrThrow('POSTMARK_API_KEY'),
    );
    this.fromEmail = this.config.getOrThrow('POSTMARK_FROM_EMAIL');
    this.replyTo = this.config.getOrThrow('POSTMARK_REPLY_TO');
    this.messageStream = this.config.get('POSTMARK_MESSAGE_STREAM', 'outbound');
  }

  /**
   * Send email using a Postmark template (recommended for production)
   */
  async sendWithTemplate(
    to: string,
    templateAlias: string,
    templateModel: Record<string, unknown>,
  ): Promise<postmark.Models.MessageSendingResponse> {
    try {
      const result = await this.client.sendEmailWithTemplate({
        From: this.fromEmail,
        To: to,
        ReplyTo: this.replyTo,
        TemplateAlias: templateAlias,
        TemplateModel: templateModel,
        MessageStream: this.messageStream,
      });

      this.logger.log(`Email sent to ${to} | Template: ${templateAlias} | MessageID: ${result.MessageID}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to} | Template: ${templateAlias}`, error);
      throw error;
    }
  }

  /**
   * Send email with raw HTML (useful for dev/testing)
   */
  async sendRaw(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string,
  ): Promise<postmark.Models.MessageSendingResponse> {
    try {
      const result = await this.client.sendEmail({
        From: this.fromEmail,
        To: to,
        ReplyTo: this.replyTo,
        Subject: subject,
        HtmlBody: htmlBody,
        TextBody: textBody || '',
        MessageStream: this.messageStream,
      });

      this.logger.log(`Email sent to ${to} | Subject: ${subject} | MessageID: ${result.MessageID}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to} | Subject: ${subject}`, error);
      throw error;
    }
  }
}
```

### 4.5 EmailModule

```typescript
// src/email/email.module.ts
import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

---

## 5. Email Template Catalog

All templates to be created in the Postmark dashboard. Each template uses an alias for easy reference in code.

| Template Alias | Trigger | Recipient | Template Variables |
|----------------|---------|-----------|-------------------|
| `booking-confirmation` | Booking created successfully | Client | customerName, bookingCode, businessName, serviceName, date, time, address, totalPrice |
| `booking-reminder-24h` | Cron job 24h before appointment | Client | customerName, bookingCode, businessName, date, time, address |
| `booking-reminder-1h` | Cron job 1h before appointment | Client | customerName, bookingCode, businessName, time |
| `booking-cancelled-by-client` | Client cancels booking | Business | businessName, clientName, bookingCode, date, time, serviceName |
| `booking-cancelled-by-business` | Business cancels booking | Client | customerName, bookingCode, businessName, reason |
| `booking-modified` | Date/time/service changed | Client | customerName, bookingCode, changes, newDate, newTime |
| `booking-noshow` | Staff marks no-show | Client | customerName, bookingCode, businessName, policy |
| `payment-receipt` | Payment processed (Wompi) | Client | customerName, bookingCode, amount, paymentMethod, transactionId |
| `payment-refund` | Refund processed | Client | customerName, bookingCode, refundAmount, originalAmount |
| `welcome-client` | New client registration | Client | customerName |
| `welcome-business` | New business registration | Business | businessName, ownerName, nextSteps |
| `password-reset` | Password reset request | User | userName, resetLink, expiresIn |
| `email-verification` | Email verification on signup | User | userName, verificationLink |
| `business-approved` | Admin approves business | Business | businessName, ownerName, dashboardLink |
| `business-rejected` | Admin rejects business | Business | businessName, ownerName, reason |
| `review-request` | 24h after completed appointment | Client | customerName, businessName, bookingCode, reviewLink |

### Usage Example — Booking Service

```typescript
// src/booking/booking.service.ts (fragment)

async createBooking(dto: CreateBookingDto, clientId: string) {
  const booking = await this.prisma.booking.create({ ... });

  // Send confirmation to client
  await this.emailService.sendWithTemplate(
    booking.client.email,
    'booking-confirmation',
    {
      customerName: booking.client.firstName,
      bookingCode: booking.code,           // RZV-XXXX
      businessName: booking.business.name,
      serviceName: booking.services.map(s => s.name).join(', '),
      date: formatDate(booking.date),       // "Lunes 26 de mayo, 2026"
      time: booking.startTime,              // "10:00 AM"
      address: booking.business.address,
      totalPrice: formatCurrency(booking.totalPrice), // "$25.00"
    },
  );

  return booking;
}
```

---

## 6. Webhooks (Email Events)

Postmark sends webhooks when email events occur. Set up an endpoint to handle bounces and complaints.

### Endpoint

```
POST /api/webhooks/postmark
```

### Events to Monitor

| Event | Action in Rezervame |
|-------|---------------------|
| `Bounce` | Mark user email as invalid, notify admin |
| `SpamComplaint` | Log, evaluate if user should be unsubscribed |
| `Delivery` | Confirm successful delivery (log) |
| `Open` | Engagement tracking (analytics) |
| `Click` | CTA click tracking (analytics) |

### Webhook Controller

```typescript
// src/email/email-webhook.controller.ts
import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';

@Controller('webhooks/postmark')
export class EmailWebhookController {
  
  @Post()
  @HttpCode(200)
  async handlePostmarkWebhook(
    @Body() payload: any,
    @Headers('x-postmark-signature') signature: string,
  ) {
    const { RecordType, Email, MessageID } = payload;

    switch (RecordType) {
      case 'Bounce':
        await this.handleBounce(Email, payload.Type);
        break;
      case 'SpamComplaint':
        await this.handleSpamComplaint(Email);
        break;
      case 'Delivery':
        // Log successful delivery
        break;
    }
  }

  private async handleBounce(email: string, bounceType: string) {
    if (bounceType === 'HardBounce') {
      // Mark email as invalid in DB
      // await this.userService.markEmailInvalid(email);
    }
  }

  private async handleSpamComplaint(email: string) {
    // Log complaint and evaluate
    // await this.userService.registerSpamComplaint(email);
  }
}
```

Once the endpoint is deployed, configure the webhook URL in the Postmark dashboard: **Servers → [your server] → Settings → Webhooks → Add Webhook**.

---

## 7. Cron Jobs — Booking Reminders

Booking reminders are processed via BullMQ scheduled jobs.

```typescript
// src/booking/jobs/booking-reminder.processor.ts

@Processor('booking-reminders')
export class BookingReminderProcessor {
  
  @Process('send-24h-reminder')
  async handle24hReminder(job: Job) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        date: {
          gte: dayjs().add(23, 'hours').toDate(),
          lte: dayjs().add(25, 'hours').toDate(),
        },
        status: 'CONFIRMED',
        reminderSent24h: false,
      },
      include: { client: true, business: true },
    });

    for (const booking of bookings) {
      await this.emailService.sendWithTemplate(
        booking.client.email,
        'booking-reminder-24h',
        {
          customerName: booking.client.firstName,
          bookingCode: booking.code,
          businessName: booking.business.name,
          date: formatDate(booking.date),
          time: booking.startTime,
          address: booking.business.address,
        },
      );

      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSent24h: true },
      });
    }
  }
}
```

---

## 8. Security Notes

- **API Key:** Stored exclusively in environment variables, never in source code
- **Webhook signature:** Validate the `x-postmark-signature` header on every incoming webhook
- **Rate limits:** Postmark allows up to 50 recipients per email and 500 messages per batch
- **Sensitive data:** Never include full payment data (card number, CVV) in emails — only last 4 digits and transaction reference

---

## 9. Implementation Checklist

- [x] Postmark account created
- [x] Domain `rezervame.com` verified (DKIM, SPF, DMARC)
- [ ] Server API Token stored in `.env`
- [ ] `EmailModule` implemented in NestJS
- [ ] `EmailService` with `sendWithTemplate` and `sendRaw` methods
- [ ] Templates created in Postmark dashboard (see catalog in §5)
- [ ] Webhook endpoint `POST /api/webhooks/postmark` implemented
- [ ] Webhook configured in Postmark dashboard pointing to the endpoint
- [ ] Booking reminder cron jobs implemented with BullMQ
- [ ] Unit tests for `EmailService`
- [ ] Integration tests for full booking → email flow

---

## 10. References

- Postmark API Docs: https://postmarkapp.com/developer
- Postmark Node.js SDK: https://www.npmjs.com/package/postmark
- Postmark Templates: https://postmarkapp.com/why/templates
- Postmark Webhooks: https://postmarkapp.com/developer/webhooks/webhooks-overview
