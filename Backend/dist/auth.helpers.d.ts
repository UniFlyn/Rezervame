import { Role, User } from '@prisma/client';
import { PrismaService } from './prisma.service';
export declare function extractBearerToken(authorization?: string): string | null;
export declare function getUserFromAuth(prisma: PrismaService, authorization?: string): Promise<User | null>;
export declare function requireUser(prisma: PrismaService, authorization: string | undefined, allowed: Role[]): Promise<User>;
export declare function requireBusinessOwner(prisma: PrismaService, authorization: string | undefined, businessId: string): Promise<{
    user: User;
    businessId: string;
}>;
export declare function canAccessBusinessMerchantSession(prisma: PrismaService, business: {
    status?: string | null;
    email: string;
}, authorization?: string): Promise<boolean>;
export declare function isBusinessPubliclyVisible(prisma: PrismaService, business: {
    status?: string | null;
    email: string;
    listingVisible?: boolean | null;
    profileSetupComplete?: boolean | null;
}, authorization?: string): Promise<boolean>;
