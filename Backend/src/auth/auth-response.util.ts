import { User } from '@prisma/client';
import type { PrismaService } from '../prisma.service';
import {
  loadSecurityPolicy,
  sessionExpiresAtIso,
} from '../config/security-policy.util';
import { signSessionToken } from './session.util';

export async function buildAuthResponse(prisma: PrismaService, user: User) {
  const policy = await loadSecurityPolicy(prisma);
  const token = signSessionToken(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    policy.sessionTimeoutMinutes,
  );
  const { password: _pw, ...safe } = user;
  return {
    token,
    user: safe,
    sessionExpiresAt: sessionExpiresAtIso(policy.sessionTimeoutMinutes),
    security: {
      minPasswordLength: policy.minPasswordLength,
      sessionTimeoutMinutes: policy.sessionTimeoutMinutes,
    },
  };
}
