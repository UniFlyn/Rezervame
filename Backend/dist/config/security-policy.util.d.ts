import type { PrismaService } from '../prisma.service';
export type SecurityPolicy = {
    minPasswordLength: number;
    sessionTimeoutMinutes: number;
    adminTwoFactorRequired: boolean;
};
export declare function loadSecurityPolicy(prisma: PrismaService): Promise<SecurityPolicy>;
export declare function passwordPolicyMessage(minLength: number): string;
export declare function assertPasswordMeetsPolicy(password: string, policy: SecurityPolicy): void;
export declare function sessionExpiresAtIso(sessionTimeoutMinutes: number, from?: Date): string;
export declare function maskEmailForDisplay(email: string): string;
