import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { loadMessagingConfig, sendPlatformEmail } from './notification-delivery.service';
import {
  notificationUrlForType,
  sendWebPushToRole,
  sendWebPushToUser,
} from './web-push-delivery.service';

export type InAppNotificationInput = {
  type: string;
  title: string;
  body: string;
  role: Role;
  userId?: string | null;
};

export async function createInAppNotification(
  prisma: PrismaService,
  input: InAppNotificationInput,
) {
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
    void sendWebPushToUser(prisma, input.userId, {
      title: input.title,
      body: input.body,
      url: notificationUrlForType(input.type, input.role),
      tag: input.type,
    }).catch((err) => {
      console.warn('[web-push] user delivery failed:', err);
    });
  } else if (input.role === Role.ADMIN) {
    void sendWebPushToRole(prisma, Role.ADMIN, {
      title: input.title,
      body: input.body,
      url: notificationUrlForType(input.type, Role.ADMIN),
      tag: input.type,
    }).catch((err) => {
      console.warn('[web-push] admin delivery failed:', err);
    });
  }

  return row;
}

/** Admin inbox + optional email (uses notifyNewTicketEmail + adminNotifyEmail). */
export async function notifyPlatformAdmins(
  prisma: PrismaService,
  input: {
    type: string;
    title: string;
    body: string;
    emailSubject?: string;
  },
): Promise<void> {
  await createInAppNotification(prisma, {
    type: input.type,
    title: input.title,
    body: input.body,
    role: Role.ADMIN,
  });

  const cfg = await loadMessagingConfig(prisma);
  const to = cfg.adminNotifyEmail?.trim();
  if (!to || !cfg.notifyNewTicketEmail) return;

  void sendPlatformEmail(prisma, {
    to,
    template: 'generic-notification',
    subject: input.emailSubject || `[Rezervame Admin] ${input.title}`,
    model: {
      recipientName: 'Admin',
      title: input.title,
      body: `${input.body} Review in the Rezervame Admin panel.`,
      ctaUrl: 'https://rezervame-admin.web.app/admin/notifications',
      ctaLabel: 'Open Admin',
    },
  });
}

/** Customer (Web / mobile) — in-app + optional email. */
export async function notifyCustomerUser(
  prisma: PrismaService,
  user: { id: string; name?: string | null; email?: string | null; phone?: string | null },
  input: {
    type: string;
    title: string;
    body: string;
    emailSubject?: string;
    emailTemplate?: import('../email/render-platform-email.util').PlatformEmailTemplate;
    emailModel?: Record<string, unknown>;
  },
): Promise<void> {
  await createInAppNotification(prisma, {
    type: input.type,
    title: input.title,
    body: input.body,
    role: Role.USER,
    userId: user.id,
  });

  if (user.email?.trim()) {
    void sendPlatformEmail(prisma, {
      to: user.email,
      template: input.emailTemplate || 'generic-notification',
      subject: input.emailSubject || `[Rezervame] ${input.title}`,
      model: {
        recipientName: user.name || 'there',
        userName: user.name || 'there',
        title: input.title,
        body: input.body,
        ...(input.emailModel || {}),
      },
    });
  }
}

/** Business account — in-app (by owner user id if exists) + email to business email. */
export async function notifyBusinessAccount(
  prisma: PrismaService,
  business: { email: string; owner?: string | null; name: string; phone?: string | null },
  input: {
    type: string;
    title: string;
    body: string;
    emailSubject?: string;
    emailTemplate?: import('../email/render-platform-email.util').PlatformEmailTemplate;
    emailModel?: Record<string, unknown>;
    sendEmail?: boolean;
  },
): Promise<void> {
  const email = business.email.trim().toLowerCase();
  const ownerUser = await prisma.user.findFirst({
    where: { email, role: Role.BUSINESS },
    select: { id: true },
  });

  await createInAppNotification(prisma, {
    type: input.type,
    title: input.title,
    body: input.body,
    role: Role.BUSINESS,
    userId: ownerUser?.id ?? null,
  });

  if (input.sendEmail !== false) {
    void sendPlatformEmail(prisma, {
      to: email,
      template: input.emailTemplate || 'generic-notification',
      subject: input.emailSubject || `[Rezervame] ${input.title}`,
      model: {
        recipientName: business.owner || business.name,
        ownerName: business.owner || business.name,
        businessName: business.name,
        title: input.title,
        body: input.body,
        subject: input.emailSubject || `[Rezervame] ${input.title}`,
        ...(input.emailModel || {}),
      },
    });
  }
}

/** Admin broadcast → all users or all businesses (existing BROADCAST type). */
export async function notifyRoleBroadcast(
  prisma: PrismaService,
  role: Role,
  message: string,
  targetLabel: string,
): Promise<{ pushSent: number; pushFailed: number; pushRecipients: number }> {
  const title = `Broadcast: ${targetLabel}`;
  await createInAppNotification(prisma, {
    type: 'BROADCAST',
    title,
    body: message,
    role,
  });
  const push = await sendWebPushToRole(prisma, role, {
    title: 'Rezervame',
    body: message,
    url: notificationUrlForType('BROADCAST', role),
    tag: 'BROADCAST',
  });
  return {
    pushSent: push.sent,
    pushFailed: push.failed,
    pushRecipients: push.recipients,
  };
}
