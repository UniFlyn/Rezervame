import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
export type WebPushPayload = {
    title: string;
    body: string;
    url?: string;
    tag?: string;
};
export declare function isWebPushConfigured(): boolean;
export declare function getVapidPublicKey(): string | null;
export declare function appBaseUrlForRole(role: Role): string;
export declare function notificationUrlForType(type: string, role?: Role): string;
export declare function sendWebPushToUser(prisma: PrismaService, userId: string, payload: WebPushPayload): Promise<{
    sent: number;
    failed: number;
}>;
export declare function sendWebPushToRole(prisma: PrismaService, role: Role, payload: WebPushPayload): Promise<{
    sent: number;
    failed: number;
    recipients: number;
}>;
export declare function upsertWebPushSubscription(prisma: PrismaService, userId: string, body: {
    endpoint?: string;
    keys?: {
        p256dh?: string;
        auth?: string;
    };
    userAgent?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    endpoint: string;
    userId: string;
    p256dh: string;
    auth: string;
    userAgent: string | null;
}>;
