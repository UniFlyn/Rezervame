import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'rezervame-dev-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

export type SessionPayload = {
  sub: string;
  role: Role;
  email: string;
};

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
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
