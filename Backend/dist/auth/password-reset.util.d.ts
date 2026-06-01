import { hashPassword } from './password.util';
export declare const PASSWORD_RESET_DEV_BYPASS = "112233";
export declare function isPasswordResetBypassCode(code: string): boolean;
export declare function generateResetCode(): string;
export declare function hashResetCode(code: string): string;
export declare function resetCodeExpiresAt(from?: Date): Date;
export { hashPassword };
