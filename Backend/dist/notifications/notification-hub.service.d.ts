import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
export type InAppNotificationInput = {
    type: string;
    title: string;
    body: string;
    role: Role;
    userId?: string | null;
};
export declare function createInAppNotification(prisma: PrismaService, input: InAppNotificationInput): Promise<{
    id: string;
    role: import(".prisma/client").$Enums.Role;
    createdAt: Date;
    body: string;
    userId: string | null;
    type: string;
    title: string;
    read: boolean;
}>;
export declare function notifyPlatformAdmins(prisma: PrismaService, input: {
    type: string;
    title: string;
    body: string;
    emailSubject?: string;
}): Promise<void>;
export declare function notifyCustomerUser(prisma: PrismaService, user: {
    id: string;
    email?: string | null;
    phone?: string | null;
}, input: {
    type: string;
    title: string;
    body: string;
    emailSubject?: string;
}): Promise<void>;
export declare function notifyBusinessAccount(prisma: PrismaService, business: {
    email: string;
    owner?: string | null;
    name: string;
    phone?: string | null;
}, input: {
    type: string;
    title: string;
    body: string;
    emailSubject?: string;
}): Promise<void>;
export declare function notifyRoleBroadcast(prisma: PrismaService, role: Role, message: string, targetLabel: string): Promise<{
    pushSent: number;
    pushFailed: number;
    pushRecipients: number;
}>;
