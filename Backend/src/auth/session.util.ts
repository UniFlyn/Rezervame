import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'rezervame-dev-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

export type SessionPayload = {
  sub: string;
  role: Role;
  email: string;
};

/** Session length from Admin → Security (minutes), unless JWT_EXPIRES_IN env overrides in production. */
export function signSessionToken(
  payload: SessionPayload,
  sessionTimeoutMinutes?: number,
): string {
  const envOverride = process.env.JWT_EXPIRES_IN?.trim();
  let expiresIn: jwt.SignOptions['expiresIn'];
  if (envOverride) {
    expiresIn = envOverride as jwt.SignOptions['expiresIn'];
  } else if (
    sessionTimeoutMinutes != null &&
    Number.isFinite(sessionTimeoutMinutes) &&
    sessionTimeoutMinutes > 0
  ) {
    expiresIn = `${Math.round(sessionTimeoutMinutes)}m` as jwt.SignOptions['expiresIn'];
  } else {
    expiresIn = JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'];
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    if (!decoded?.sub) return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Legacy dev tokens: `token-{userId}` */
export function userIdFromLegacyToken(token: string): string | null {
  if (!token.startsWith('token-')) return null;
  const id = token.slice('token-'.length).trim();
  return id.length > 0 ? id : null;
}
