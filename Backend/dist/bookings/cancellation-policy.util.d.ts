import { Business, Booking } from '@prisma/client';
export type CancellationPolicyConfig = {
    allowed: boolean;
    hoursBefore: number;
};
export type CancellationCheckResult = {
    allowed: boolean;
    code: 'allowed' | 'not_allowed' | 'too_late' | 'terminal_status' | 'pending_free';
    message: string;
};
export declare function normalizeCancellationPolicy(business: Pick<Business, 'cancellationAllowed' | 'cancellationHoursBefore'> | null | undefined): CancellationPolicyConfig;
export declare function formatCancellationPolicyMessage(policy: CancellationPolicyConfig, lang?: 'en' | 'es'): string;
export declare function canCustomerCancelBooking(booking: Pick<Booking, 'status' | 'date' | 'transactionId'>, business: Pick<Business, 'cancellationAllowed' | 'cancellationHoursBefore'> | null | undefined, now?: Date): CancellationCheckResult;
export declare function assertCustomerCanCancelBooking(booking: Pick<Booking, 'status' | 'date' | 'transactionId'>, business: Pick<Business, 'cancellationAllowed' | 'cancellationHoursBefore'> | null | undefined, now?: Date): void;
export declare function attachCancellationMeta<T extends Record<string, unknown>>(row: T, business: Business | null | undefined): T & {
    cancellationPolicy: CancellationPolicyConfig;
    cancellationPolicyMessageEn: string;
    cancellationPolicyMessageEs: string;
    canCancel: boolean;
    cancelBlockReason?: string;
};
