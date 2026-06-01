import { Business } from '@prisma/client';
import { PrismaService } from '../prisma.service';
export declare function cancelBookingsForCustomer(prisma: PrismaService, userId: string, bookingIds: string[]): Promise<{
    cancelled: number;
}>;
export declare function enrichBookingCancellationFields<T extends Record<string, unknown> & {
    status?: string;
    date?: Date;
    transactionId?: string | null;
    business?: Business | null;
}>(row: T): T & {
    cancellationPolicy: {
        allowed: boolean;
        hoursBefore: number;
    };
    canCancel: boolean;
    cancelBlockReason: string | null;
};
