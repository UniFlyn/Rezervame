import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { getStripeClient, resolveStripeSecretKey } from './stripe.util';

function webAppBaseUrl(): string {
  return (
    process.env.WEB_APP_URL?.trim() ||
    process.env.FRONTEND_URL?.trim() ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export async function createStripeCheckoutForBookings(
  prisma: PrismaService,
  user: User,
  bookingIds: string[],
): Promise<{ url: string; sessionId: string }> {
  const secretKey = await resolveStripeSecretKey(prisma);
  if (!secretKey) {
    throw new ServiceUnavailableException('Stripe is not configured on this server');
  }

  const bookings = await prisma.booking.findMany({
    where: { id: { in: bookingIds }, userId: user.id },
    include: { service: true, business: true },
  });
  if (bookings.length === 0) throw new BadRequestException('No valid bookings found');

  const payable = bookings.filter(
    (b) => b.status !== 'Cancelled' && b.status !== 'Rejected' && b.status !== 'Completed',
  );
  if (payable.length === 0) {
    throw new BadRequestException('All bookings are already completed or cancelled');
  }

  const totalCents = Math.round(
    payable.reduce((sum, b) => sum + b.price + (b.taxAmount || 0), 0) * 100,
  );
  if (totalCents < 50) {
    throw new BadRequestException('Payment amount is too small for card checkout');
  }

  const businessName = payable[0].business?.name || 'Rezervame booking';
  const lineDescription = payable
    .map((b) => b.service?.name || 'Service')
    .slice(0, 5)
    .join(', ');

  const stripe = getStripeClient(secretKey);
  const base = webAppBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: (process.env.STRIPE_CURRENCY || 'usd').toLowerCase(),
          unit_amount: totalCents,
          product_data: {
            name: businessName,
            description: lineDescription,
          },
        },
      },
    ],
    success_url: `${base}/profile?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/profile?payment=cancelled`,
    metadata: {
      userId: user.id,
      bookingIds: JSON.stringify(payable.map((b) => b.id)),
    },
  });

  if (!session.url) {
    throw new ServiceUnavailableException('Stripe did not return a checkout URL');
  }

  await prisma.paymentCheckout.create({
    data: {
      stripeSessionId: session.id,
      userId: user.id,
      bookingIds: JSON.stringify(payable.map((b) => b.id)),
      amount: totalCents / 100,
      status: 'pending',
    },
  });

  return { url: session.url, sessionId: session.id };
}

export async function resolveStripeWebhookSecret(prisma: PrismaService): Promise<string | null> {
  const fromEnv = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (fromEnv) return fromEnv;
  const config = await prisma.systemConfig.findUnique({ where: { id: 1 } });
  return config?.stripeWebhookSecret?.trim() || null;
}
