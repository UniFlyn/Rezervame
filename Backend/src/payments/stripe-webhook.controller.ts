import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { PrismaService } from '../prisma.service';
import { finalizeBookingGroupPayment } from './booking-payment.util';
import { getStripeClient, resolveStripeSecretKey } from './stripe.util';
import { resolveStripeWebhookSecret } from './stripe-checkout.util';

@Controller('webhooks')
export class StripeWebhookController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('stripe')
  async handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    const secretKey = await resolveStripeSecretKey(this.prisma);
    const webhookSecret = await resolveStripeWebhookSecret(this.prisma);
    if (!secretKey || !webhookSecret) {
      throw new ServiceUnavailableException('Stripe webhook is not configured');
    }
    if (!signature) throw new BadRequestException('Missing stripe-signature header');

    const rawBody = req.rawBody;
    if (!rawBody) throw new BadRequestException('Missing raw body for webhook verification');

    const stripe = getStripeClient(secretKey);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== 'paid') {
        return { received: true, skipped: 'not_paid' };
      }

      const checkout = await this.prisma.paymentCheckout.findUnique({
        where: { stripeSessionId: session.id },
      });
      if (!checkout || checkout.status === 'completed') {
        return { received: true, skipped: 'already_processed' };
      }

      const user = await this.prisma.user.findUnique({ where: { id: checkout.userId } });
      if (!user) return { received: true, skipped: 'no_user' };

      let bookingIds: string[] = [];
      try {
        bookingIds = JSON.parse(checkout.bookingIds) as string[];
      } catch {
        bookingIds = [];
      }
      if (bookingIds.length === 0 && session.metadata?.bookingIds) {
        try {
          bookingIds = JSON.parse(session.metadata.bookingIds) as string[];
        } catch {
          bookingIds = [];
        }
      }

      await finalizeBookingGroupPayment(this.prisma, user, bookingIds, 'Stripe');
      await this.prisma.paymentCheckout.update({
        where: { id: checkout.id },
        data: { status: 'completed', completedAt: new Date() },
      });
    }

    return { received: true };
  }
}
