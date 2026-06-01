import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { userIdFromLegacyToken, verifySessionToken } from './auth/session.util';
import { isBusinessDiscoverable } from './business/business-listing.util';
import { PrismaService } from './prisma.service';

export function extractBearerToken(authorization?: string): string | null {
  if (!authorization) return null;
  const m = authorization.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function getUserFromAuth(prisma: PrismaService, authorization?: string): Promise<User | null> {
  const token = extractBearerToken(authorization);
  if (!token) return null;

  const jwtPayload = verifySessionToken(token);
  if (jwtPayload?.sub) {
    return prisma.user.findUnique({ where: { id: jwtPayload.sub } });
  }

  const legacyId = userIdFromLegacyToken(token);
  if (legacyId) {
    return prisma.user.findUnique({ where: { id: legacyId } });
  }

  return null;
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
  if (user.role === Role.USER && (user.status || '').toLowerCase() === 'blocked') {
    throw new ForbiddenException('Account suspended');
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

function isBusinessPanelPrivileged(
  user: User | null,
  business: { status?: string | null; email: string },
): boolean {
  if (!user) return false;
  if (user.role === Role.ADMIN) return true;
  if (user.role === Role.BUSINESS && business.email === user.email) return true;
  return false;
}

/** Public storefront / discovery; owners and admins may preview before going live. */
export async function isBusinessPubliclyVisible(
  prisma: PrismaService,
  business: {
    status?: string | null;
    email: string;
    listingVisible?: boolean | null;
    profileSetupComplete?: boolean | null;
  },
  authorization?: string,
): Promise<boolean> {
  const user = await getUserFromAuth(prisma, authorization);
  if (isBusinessPanelPrivileged(user, business)) {
    const status = (business.status || '').toLowerCase().trim();
    if (status === 'active') return true;
    if (user?.role === Role.ADMIN) return true;
    if (user?.role === Role.BUSINESS && status === 'pending') return true;
    return false;
  }

  return isBusinessDiscoverable({
    status: business.status ?? '',
    listingVisible: Boolean(business.listingVisible),
    profileSetupComplete: Boolean(business.profileSetupComplete),
  });
}
