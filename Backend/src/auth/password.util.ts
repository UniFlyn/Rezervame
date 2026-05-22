import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

export function isPasswordHash(stored: string): boolean {
  return stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$');
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (isPasswordHash(stored)) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
}

/** Re-hash legacy plaintext passwords on successful login. */
export async function maybeUpgradePasswordHash(plain: string, stored: string): Promise<string | null> {
  if (isPasswordHash(stored)) return null;
  if (plain !== stored) return null;
  return hashPassword(plain);
}
