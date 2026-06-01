import { createHash, randomInt } from 'crypto';
import { hashPassword } from './password.util';

const CODE_TTL_MS = 15 * 60 * 1000;

/** Developer bypass — accepted on verify/reset without a stored email code. */
export const PASSWORD_RESET_DEV_BYPASS = '112233';

export function isPasswordResetBypassCode(code: string): boolean {
  return code.trim() === PASSWORD_RESET_DEV_BYPASS;
}

export function generateResetCode(): string {
  return String(randomInt(100000, 1000000));
}

export function hashResetCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

export function resetCodeExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + CODE_TTL_MS);
}

export { hashPassword };
