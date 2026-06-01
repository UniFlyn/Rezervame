import { User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
export type SettlementResult = {
    grossSubtotal: number;
    totalTax: number;
    commissionAmount: number;
    businessCredit: number;
    customerTotal: number;
};
export declare function loadDefaultCommissionPercent(prisma: PrismaService): Promise<number>;
export declare function calculateBookingSettlement(bookings: Array<{
    price: number;
    taxAmount?: number | null;
}>, commissionPercent: number): SettlementResult;
export declare function applyPaymentSettlement(prisma: PrismaService, businessId: string, settlement: SettlementResult): Promise<void>;
export declare function finalizeBookingGroupPayment(prisma: PrismaService, user: User, bookingIds: string[], paymentMethod: string): Promise<{
    ok: true;
    transactionId: string;
    total: number;
    commissionAmount: number;
    businessCredit: number;
}>;
export declare function dedupeTransactionsByBookingGroup<T extends {
    id: string;
    date: Date;
    bookings: Array<{
        id: string;
        bookingGroupId: string | null;
    }>;
}>(txList: T[]): T[];
export declare function finalizeBusinessBookingGroupPayment(prisma: PrismaService, businessId: string, bookingIds: string[], paymentMethod: string): Promise<{
    description: string | null;
    id: string;
    status: string;
    businessId: string;
    date: Date;
    taxAmount: number;
    paymentMethod: string;
    bookingId: string | null;
    customerEmail: string | null;
    staffMember: string | null;
    amount: number;
    commissionAmount: number;
    type: string;
}>;
