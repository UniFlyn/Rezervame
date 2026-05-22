import { User } from '@prisma/client';
import { signSessionToken } from './session.util';

export function buildAuthResponse(user: User) {
  const token = signSessionToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });
  const { password: _pw, ...safe } = user;
  return { token, user: safe };
}
