import Stripe from 'stripe';
import { PrismaService } from '../prisma.service';
export declare function getStripeClient(secretKey: string): Stripe;
export declare function resolveStripeSecretKey(prisma: PrismaService): Promise<string | null>;
