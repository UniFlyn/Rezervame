import { Role } from '@prisma/client';
export type SessionPayload = {
    sub: string;
    role: Role;
    email: string;
};
export declare function signSessionToken(payload: SessionPayload, sessionTimeoutMinutes?: number): string;
export declare function verifySessionToken(token: string): SessionPayload | null;
export declare function userIdFromLegacyToken(token: string): string | null;
