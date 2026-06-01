"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInAppNotification = createInAppNotification;
exports.notifyPlatformAdmins = notifyPlatformAdmins;
exports.notifyCustomerUser = notifyCustomerUser;
exports.notifyBusinessAccount = notifyBusinessAccount;
exports.notifyRoleBroadcast = notifyRoleBroadcast;
const client_1 = require("@prisma/client");
const notification_delivery_service_1 = require("./notification-delivery.service");
const web_push_delivery_service_1 = require("./web-push-delivery.service");
async function createInAppNotification(prisma, input) {
    const row = await prisma.notification.create({
        data: {
            type: input.type.slice(0, 64),
            title: input.title.slice(0, 200),
            body: input.body.slice(0, 4000),
            role: input.role,
            userId: input.userId ?? null,
        },
    });
    if (input.userId) {
        void (0, web_push_delivery_service_1.sendWebPushToUser)(prisma, input.userId, {
            title: input.title,
            body: input.body,
            url: (0, web_push_delivery_service_1.notificationUrlForType)(input.type, input.role),
            tag: input.type,
        }).catch((err) => {
            console.warn('[web-push] user delivery failed:', err);
        });
    }
    else if (input.role === client_1.Role.ADMIN) {
        void (0, web_push_delivery_service_1.sendWebPushToRole)(prisma, client_1.Role.ADMIN, {
            title: input.title,
            body: input.body,
            url: (0, web_push_delivery_service_1.notificationUrlForType)(input.type, client_1.Role.ADMIN),
            tag: input.type,
        }).catch((err) => {
            console.warn('[web-push] admin delivery failed:', err);
        });
    }
    return row;
}
async function notifyPlatformAdmins(prisma, input) {
    await createInAppNotification(prisma, {
        type: input.type,
        title: input.title,
        body: input.body,
        role: client_1.Role.ADMIN,
    });
    const cfg = await (0, notification_delivery_service_1.loadMessagingConfig)(prisma);
    const to = cfg.adminNotifyEmail?.trim();
    if (!to || !cfg.notifyNewTicketEmail)
        return;
    void (0, notification_delivery_service_1.sendEmail)(prisma, to, input.emailSubject || `[Rezervame Admin] ${input.title}`, `<p>${input.body}</p><p>Review in the Rezervame Admin panel.</p>`, input.body);
}
async function notifyCustomerUser(prisma, user, input) {
    await createInAppNotification(prisma, {
        type: input.type,
        title: input.title,
        body: input.body,
        role: client_1.Role.USER,
        userId: user.id,
    });
    if (user.email?.trim()) {
        void (0, notification_delivery_service_1.sendEmail)(prisma, user.email, input.emailSubject || `[Rezervame] ${input.title}`, `<p>${input.body}</p>`, input.body);
    }
}
async function notifyBusinessAccount(prisma, business, input) {
    const email = business.email.trim().toLowerCase();
    const ownerUser = await prisma.user.findFirst({
        where: { email, role: client_1.Role.BUSINESS },
        select: { id: true },
    });
    await createInAppNotification(prisma, {
        type: input.type,
        title: input.title,
        body: input.body,
        role: client_1.Role.BUSINESS,
        userId: ownerUser?.id ?? null,
    });
    void (0, notification_delivery_service_1.sendEmail)(prisma, email, input.emailSubject || `[Rezervame] ${input.title}`, `<p>Hi ${business.owner || business.name},</p><p>${input.body}</p>`, input.body);
}
async function notifyRoleBroadcast(prisma, role, message, targetLabel) {
    const title = `Broadcast: ${targetLabel}`;
    await createInAppNotification(prisma, {
        type: 'BROADCAST',
        title,
        body: message,
        role,
    });
    const push = await (0, web_push_delivery_service_1.sendWebPushToRole)(prisma, role, {
        title: 'Rezervame',
        body: message,
        url: (0, web_push_delivery_service_1.notificationUrlForType)('BROADCAST', role),
        tag: 'BROADCAST',
    });
    return {
        pushSent: push.sent,
        pushFailed: push.failed,
        pushRecipients: push.recipients,
    };
}
//# sourceMappingURL=notification-hub.service.js.map