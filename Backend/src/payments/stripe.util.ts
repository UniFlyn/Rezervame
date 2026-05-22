import Stripe from 'stripe';
import { PrismaService } from '../prisma.service';

export function getStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey);
}

export async function resolveStripeSecretKey(prisma: PrismaService): Promise<string | null> {
  const fromEnv = process.env.STRIPE_SECRET_KEY?.trim();
  if (fromEnv) return fromEnv;
  try {
    const config = await prisma.systemConfig.findUnique({ where: { id: 1 } });
    return config?.stripeApiKey?.trim() || null;
  } catch {
    return null;
  }
}
