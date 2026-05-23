import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as WebPush from 'web-push';
import { PrismaService } from '../prisma.service';

/** CJS/ESM-safe handle — default import can be undefined under Node 25 + Nest. */
function webPushLib(): typeof WebPush | null {
  const mod = WebPush as typeof WebPush & { default?: typeof WebPush };
  if (typeof mod.setVapidDetails === 'function') return mod;
  if (mod.default && typeof mod.default.setVapidDetails === 'function') return mod.default;
  return null;
}

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

let vapidReady = false;

export function isWebPushConfigured(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  return Boolean(publicKey && privateKey);
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

function ensureVapid(): boolean {
  if (vapidReady) return true;
  const wp = webPushLib();
  if (!wp) return false;
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return false;
  try {
    const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:admin@rezervame.com';
    wp.setVapidDetails(subject, publicKey, privateKey);
    vapidReady = true;
    return true;
  } catch (err) {
    console.warn('[web-push] VAPID init failed:', err);
    return false;
  }
}

export function appBaseUrlForRole(role: Role): string {
  const web = (process.env.WEB_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const admin = (process.env.ADMIN_APP_URL || 'http://localhost:3001').replace(/\/$/, '');
  if (role === Role.ADMIN) return admin;
  return web;
}

export function notificationUrlForType(type: string, role: Role = Role.USER): string {
  const t = type.toUpperCase();
  if (role === Role.ADMIN) {
    if (t.includes('BROADCAST')) return '/admin/notifications';
    return '/admin/notifications';
  }
  if (role === Role.BUSINESS) {
    if (t.includes('BROADCAST')) return '/business/dashboard';
    if (t.includes('BOOKING') || t.includes('APPOINTMENT')) return '/business/appointments';
    return '/business/settings';
  }
  if (t.includes('BOOKING') || t.includes('APPOINTMENT')) return '/profile?tab=bookings';
  if (t.includes('BROADCAST')) return '/';
  if (t.includes('SUPPORT') || t.includes('TICKET')) return '/customer-service';
  return '/profile';
}

function resolvePushUrl(role: Role, url?: string): string {
  const base = appBaseUrlForRole(role);
  if (!url) return base;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

export async function sendWebPushToUser(
  prisma: PrismaService,
  userId: string,
  payload: WebPushPayload,
): Promise<{ sent: number; failed: number }> {
  const wp = webPushLib();
  if (!wp || !ensureVapid()) return { sent: 0, failed: 0 };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { webPushEnabled: true, role: true },
  });
  if (!user?.webPushEnabled) return { sent: 0, failed: 0 };

  const subs = await prisma.webPushSubscription.findMany({ where: { userId } });
  if (!subs.length) return { sent: 0, failed: 0 };

  const pushBody = JSON.stringify({
    title: payload.title.slice(0, 120),
    body: payload.body.slice(0, 240),
    url: resolvePushUrl(user.role, payload.url),
    tag: payload.tag || 'rezervame',
  });

  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  for (const sub of subs) {
    try {
      await wp.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        pushBody,
      );
      sent += 1;
    } catch (err: unknown) {
      failed += 1;
      const status =
        typeof err === 'object' && err !== null && 'statusCode' in err
          ? (err as { statusCode: number }).statusCode
          : 0;
      if (status === 404 || status === 410) {
        staleEndpoints.push(sub.endpoint);
      }
    }
  }

  if (staleEndpoints.length) {
    await prisma.webPushSubscription.deleteMany({
      where: { endpoint: { in: staleEndpoints } },
    });
  }

  return { sent, failed };
}

/** Fan-out browser push to every opted-in account with the given role. */
export async function sendWebPushToRole(
  prisma: PrismaService,
  role: Role,
  payload: WebPushPayload,
): Promise<{ sent: number; failed: number; recipients: number }> {
  if (!ensureVapid()) return { sent: 0, failed: 0, recipients: 0 };

  const users = await prisma.user.findMany({
    where: {
      role,
      webPushEnabled: true,
      webPushSubscriptions: { some: {} },
    },
    select: { id: true },
  });

  let sent = 0;
  let failed = 0;
  const path =
    payload.url ?? notificationUrlForType(payload.tag || 'BROADCAST', role);

  for (const u of users) {
    const r = await sendWebPushToUser(prisma, u.id, {
      ...payload,
      url: path,
    });
    sent += r.sent;
    failed += r.failed;
  }

  return { sent, failed, recipients: users.length };
}

export async function upsertWebPushSubscription(
  prisma: PrismaService,
  userId: string,
  body: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
    userAgent?: string;
  },
) {
  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();
  if (!endpoint || !p256dh || !auth) {
    throw new BadRequestException('Invalid push subscription');
  }

  return prisma.webPushSubscription.upsert({
    where: { endpoint },
    update: {
      userId,
      p256dh,
      auth,
      userAgent: body.userAgent?.slice(0, 512) ?? null,
    },
    create: {
      userId,
      endpoint,
      p256dh,
      auth,
      userAgent: body.userAgent?.slice(0, 512) ?? null,
    },
  });
}
