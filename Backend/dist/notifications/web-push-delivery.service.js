"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWebPushConfigured = isWebPushConfigured;
exports.getVapidPublicKey = getVapidPublicKey;
exports.appBaseUrlForRole = appBaseUrlForRole;
exports.notificationUrlForType = notificationUrlForType;
exports.sendWebPushToUser = sendWebPushToUser;
exports.sendWebPushToRole = sendWebPushToRole;
exports.upsertWebPushSubscription = upsertWebPushSubscription;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const WebPush = __importStar(require("web-push"));
function webPushLib() {
    const mod = WebPush;
    if (typeof mod.setVapidDetails === 'function')
        return mod;
    if (mod.default && typeof mod.default.setVapidDetails === 'function')
        return mod.default;
    return null;
}
let vapidReady = false;
function isWebPushConfigured() {
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
    return Boolean(publicKey && privateKey);
}
function getVapidPublicKey() {
    return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}
function ensureVapid() {
    if (vapidReady)
        return true;
    const wp = webPushLib();
    if (!wp)
        return false;
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
    if (!publicKey || !privateKey)
        return false;
    try {
        const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:admin@rezervame.com';
        wp.setVapidDetails(subject, publicKey, privateKey);
        vapidReady = true;
        return true;
    }
    catch (err) {
        console.warn('[web-push] VAPID init failed:', err);
        return false;
    }
}
function appBaseUrlForRole(role) {
    const web = (process.env.WEB_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const admin = (process.env.ADMIN_APP_URL || 'http://localhost:3001').replace(/\/$/, '');
    if (role === client_1.Role.ADMIN)
        return admin;
    return web;
}
function notificationUrlForType(type, role = client_1.Role.USER) {
    const t = type.toUpperCase();
    if (role === client_1.Role.ADMIN) {
        if (t.includes('BROADCAST'))
            return '/admin/notifications';
        return '/admin/notifications';
    }
    if (role === client_1.Role.BUSINESS) {
        if (t.includes('BROADCAST'))
            return '/business/dashboard';
        if (t.includes('BOOKING') || t.includes('APPOINTMENT'))
            return '/business/appointments';
        return '/business/settings';
    }
    if (t.includes('BOOKING') || t.includes('APPOINTMENT'))
        return '/profile?tab=bookings';
    if (t.includes('BROADCAST'))
        return '/';
    if (t.includes('SUPPORT') || t.includes('TICKET'))
        return '/customer-service';
    return '/profile';
}
function resolvePushUrl(role, url) {
    const base = appBaseUrlForRole(role);
    if (!url)
        return base;
    if (url.startsWith('http://') || url.startsWith('https://'))
        return url;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
}
async function sendWebPushToUser(prisma, userId, payload) {
    const wp = webPushLib();
    if (!wp || !ensureVapid())
        return { sent: 0, failed: 0 };
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { webPushEnabled: true, role: true },
    });
    if (!user?.webPushEnabled)
        return { sent: 0, failed: 0 };
    const subs = await prisma.webPushSubscription.findMany({ where: { userId } });
    if (!subs.length)
        return { sent: 0, failed: 0 };
    const pushBody = JSON.stringify({
        title: payload.title.slice(0, 120),
        body: payload.body.slice(0, 240),
        url: resolvePushUrl(user.role, payload.url),
        tag: payload.tag || 'rezervame',
    });
    let sent = 0;
    let failed = 0;
    const staleEndpoints = [];
    for (const sub of subs) {
        try {
            await wp.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
            }, pushBody);
            sent += 1;
        }
        catch (err) {
            failed += 1;
            const status = typeof err === 'object' && err !== null && 'statusCode' in err
                ? err.statusCode
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
async function sendWebPushToRole(prisma, role, payload) {
    if (!ensureVapid())
        return { sent: 0, failed: 0, recipients: 0 };
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
    const path = payload.url ?? notificationUrlForType(payload.tag || 'BROADCAST', role);
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
async function upsertWebPushSubscription(prisma, userId, body) {
    const endpoint = body.endpoint?.trim();
    const p256dh = body.keys?.p256dh?.trim();
    const auth = body.keys?.auth?.trim();
    if (!endpoint || !p256dh || !auth) {
        throw new common_1.BadRequestException('Invalid push subscription');
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
//# sourceMappingURL=web-push-delivery.service.js.map