import { User } from '@prisma/client';
import type { PrismaService } from '../prisma.service';
export declare function buildAuthResponse(prisma: PrismaService, user: User): Promise<{
    token: string;
    user: {
        name: string;
        id: string;
        email: string;
        phone: string | null;
        address: string | null;
        status: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
        avatar: string | null;
        gender: string | null;
        age: number | null;
        webPushEnabled: boolean;
    };
    sessionExpiresAt: string;
    security: {
        minPasswordLength: number;
        sessionTimeoutMinutes: number;
    };
}>;
