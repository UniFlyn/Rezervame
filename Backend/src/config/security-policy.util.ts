import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';

export type SecurityPolicy = {
  minPasswordLength: number;
  sessionTimeoutMinutes: number;
  adminTwoFactorRequired: boolean;
};

const DEFAULTS: SecurityPolicy = {
  minPasswordLength: 8,
  sessionTimeoutMinutes: 60,
  adminTwoFactorRequired: true,
};

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export async function loadSecurityPolicy(prisma: PrismaService): Promise<SecurityPolicy> {
  try {
    const row = await prisma.systemConfig.findUnique({
      where: { id: 1 },
      select: {
        minPasswordLength: true,
        sessionTimeout: true,
        twoFactorMandatory: true,
      },
    });
    if (!row) return { ...DEFAULTS };
    return {
      minPasswordLength: clampInt(row.minPasswordLength, 4, 128, DEFAULTS.minPasswordLength),
      sessionTimeoutMinutes: clampInt(row.sessionTimeout, 5, 10_080, DEFAULTS.sessionTimeoutMinutes),
      adminTwoFactorRequired: row.twoFactorMandatory !== false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function passwordPolicyMessage(minLength: number): string {
  return `Password must be at least ${minLength} characters.`;
}

export function assertPasswordMeetsPolicy(password: string, policy: SecurityPolicy): void {
  const plain = (password || '').trim();
  if (plain.length < policy.minPasswordLength) {
    throw new BadRequestException(passwordPolicyMessage(policy.minPasswordLength));
  }
}

export function sessionExpiresAtIso(sessionTimeoutMinutes: number, from = new Date()): string {
  return new Date(from.getTime() + sessionTimeoutMinutes * 60_000).toISOString();
}

export function maskEmailForDisplay(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || !local) return email;
  if (local.length <= 2) return `${local[0] ?? ''}*@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}
