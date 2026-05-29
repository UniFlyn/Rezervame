import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { readPostmarkConfig } from './postmark.config';

type PostmarkWebhookPayload = {
  RecordType?: string;
  Email?: string;
  MessageID?: string;
  Type?: string;
  BouncedAt?: string;
  Description?: string;
};

@Controller('webhooks')
export class EmailWebhookController {
  private readonly logger = new Logger(EmailWebhookController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post('postmark')
  @HttpCode(200)
  async handlePostmarkWebhook(
    @Body() payload: PostmarkWebhookPayload,
    @Headers('x-postmark-webhook-token') webhookToken?: string,
  ) {
    const cfg = readPostmarkConfig();
    if (cfg?.webhookToken) {
      if (webhookToken !== cfg.webhookToken) {
        throw new UnauthorizedException('Invalid Postmark webhook token');
      }
    }

    const recordType = payload.RecordType || 'Unknown';
    const email = (payload.Email || '').trim().toLowerCase();
    const messageId = payload.MessageID || '';

    this.logger.log(`Postmark webhook: ${recordType} ${email} ${messageId}`);

    try {
      await this.prisma.notificationDelivery.create({
        data: {
          channel: 'email_webhook',
          recipient: email || 'unknown',
          subject: recordType,
          body: JSON.stringify(payload).slice(0, 8000),
          status: recordType.toLowerCase(),
          meta: messageId || undefined,
        },
      });
    } catch {
      // notificationDelivery table may be missing during migration
    }

    switch (recordType) {
      case 'Bounce':
        await this.handleBounce(email, payload.Type || 'Unknown');
        break;
      case 'SpamComplaint':
        await this.handleSpamComplaint(email);
        break;
      case 'Delivery':
      case 'Open':
      case 'Click':
        break;
      default:
        break;
    }

    return { ok: true };
  }

  private async handleBounce(email: string, bounceType: string) {
    if (!email) return;
    if (bounceType === 'HardBounce') {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user && user.status === 'active') {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { status: 'email_bounced' },
        });
        this.logger.warn(`Marked user ${user.id} as email_bounced (${email})`);
      }
    }
  }

  private async handleSpamComplaint(email: string) {
    if (!email) return;
    this.logger.warn(`Spam complaint from ${email}`);
  }
}
