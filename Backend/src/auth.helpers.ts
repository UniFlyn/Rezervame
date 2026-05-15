import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from './prisma.service';

export function extractBearerToken(authorization?: string): string | null {
  if (!authorization) return null;
  const m = authorization.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function userIdFromSessionToken(token: string): string | null {
  if (!token.startsWith('token-')) return null;
  return token.slice('token-'.length);
}

export async function getUserFromAuth(prisma: PrismaService, authorization?: string): Promise<User | null> {
  const token = extractBearerToken(authorization);
  if (!token) return null;
  const id = userIdFromSessionToken(token);
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function requireUser(
  prisma: PrismaService,
  authorization: string | undefined,
  allowed: Role[],
): Promise<User> {
  const user = await getUserFromAuth(prisma, authorization);
  if (!user || !allowed.includes(user.role)) {
    throw new UnauthorizedException('Invalid or missing session');
  }
  return user;
}

export async function requireBusinessOwner(
  prisma: PrismaService,
  authorization: string | undefined,
  businessId: string,
): Promise<{ user: User; businessId: string }> {
  const user = await requireUser(prisma, authorization, [Role.BUSINESS]);
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || business.email !== user.email) {
    throw new ForbiddenException('Not allowed for this business');
  }
  return { user, businessId };
}

/** Public discovery shows only [active] businesses; owners and admins may still load panel/storefront data. */
export async function isBusinessPubliclyVisible(
  prisma: PrismaService,
  business: { status: string; email: string },
  authorization?: string,
): Promise<boolean> {
  if (business.status === 'active') return true;
  const user = await getUserFromAuth(prisma, authorization);
  if (!user) return false;
  if (user.role === Role.ADMIN) return true;
  if (user.role === Role.BUSINESS && business.email === user.email) return true;
  return false;
}
