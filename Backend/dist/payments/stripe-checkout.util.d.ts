import { User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
export declare function createStripeCheckoutForBookings(prisma: PrismaService, user: User, bookingIds: string[]): Promise<{
    url: string;
    sessionId: string;
}>;
export declare function resolveStripeWebhookSecret(prisma: PrismaService): Promise<string | null>;
