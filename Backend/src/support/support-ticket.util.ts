import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { notifyUserTicketUpdate } from '../notifications/notification-delivery.service';
import {
  notifyBusinessAccount,
  notifyCustomerUser,
  notifyPlatformAdmins,
} from '../notifications/notification-hub.service';

function safeAttachmentUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const s = url.trim();
  if (!s) return null;
  if (s.startsWith('data:') && s.length > 1_500_000) return null;
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image/')) return s;
  return null;
}

/** API list payloads: omit huge base64 blobs; detail views can opt in. */
function attachmentForApi(url: string | null | undefined, includeInline: boolean): string | null {
  if (!url?.trim()) return null;
  const s = url.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (includeInline && s.startsWith('data:image/')) return s;
  return null;
}

function hasInlineAttachment(url: string | null | undefined): boolean {
  return Boolean(url?.trim().startsWith('data:image/'));
}

async function nextTicketRef(prisma: PrismaService): Promise<string> {
  const count = await prisma.supportTicket.count();
  return `TKT-${String(count + 1).padStart(6, '0')}`;
}

export async function createSupportTicket(
  prisma: PrismaService,
  input: {
    subject: string;
    message: string;
    category?: string;
    priority?: string;
    screenshotUrl?: string | null;
    businessId?: string | null;
    userId?: string | null;
    createdByRole: Role;
    requesterName: string;
    requesterEmail?: string | null;
    requesterPhone?: string | null;
  },
) {
  const subject = String(input.subject || '').trim();
  const message = String(input.message || '').trim();
  if (subject.length < 3) throw new BadRequestException('Subject must be at least 3 characters');
  if (message.length < 8) throw new BadRequestException('Message must be at least 8 characters');

  const ticketRef = await nextTicketRef(prisma);
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketRef,
      subject: subject.slice(0, 200),
      category: (input.category || 'general').slice(0, 50),
      priority: (input.priority || 'normal').slice(0, 20),
      status: 'open',
      businessId: input.businessId || null,
      userId: input.userId || null,
      createdByRole: input.createdByRole,
      requesterName: input.requesterName.slice(0, 120),
      requesterEmail: input.requesterEmail?.trim() || null,
      screenshotUrl: safeAttachmentUrl(input.screenshotUrl),
      messages: {
        create: {
          body: message.slice(0, 8000),
          senderRole: input.createdByRole,
          senderName: input.requesterName,
          attachmentUrl: safeAttachmentUrl(input.screenshotUrl),
        },
      },
    },
    include: { messages: true, business: true, user: true },
  });

  const fromLabel =
    input.createdByRole === Role.BUSINESS
      ? 'Business'
      : input.createdByRole === Role.USER
        ? 'Customer'
        : String(input.createdByRole);

  void notifyPlatformAdmins(prisma, {
    type: 'SUPPORT_TICKET',
    title: `${fromLabel} support: ${ticket.subject}`,
    body: `${ticket.requesterName} (${ticket.ticketRef}) — ${ticket.category}`,
    emailSubject: `[Rezervame] ${ticket.ticketRef} — ${ticket.subject}`,
  });

  if (input.requesterEmail) {
    void notifyUserTicketUpdate(
      prisma,
      input.requesterEmail,
      input.requesterPhone,
      ticket.ticketRef,
      'We received your support request and will respond shortly.',
    );
  }

  return ticket;
}

export async function addSupportTicketReply(
  prisma: PrismaService,
  ticketId: string,
  input: {
    body: string;
    senderRole: Role;
    senderName?: string;
    attachmentUrl?: string | null;
    reopen?: boolean;
  },
) {
  const body = String(input.body || '').trim();
  if (body.length < 1) throw new BadRequestException('Reply cannot be empty');

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { business: true, user: true },
  });
  if (!ticket) throw new BadRequestException('Ticket not found');

  const msg = await prisma.supportMessage.create({
    data: {
      ticketId,
      body: body.slice(0, 8000),
      senderRole: input.senderRole,
      senderName: input.senderName?.slice(0, 120) || null,
      attachmentUrl: safeAttachmentUrl(input.attachmentUrl),
    },
  });

  const nextStatus =
    input.senderRole === Role.ADMIN
      ? ticket.status === 'resolved' || ticket.status === 'closed'
        ? 'in_progress'
        : ticket.status === 'open'
          ? 'in_progress'
          : ticket.status
      : input.reopen
        ? 'open'
        : ticket.status;

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: nextStatus, updatedAt: new Date() },
  });

  const notifyEmail =
    input.senderRole === Role.ADMIN
      ? ticket.requesterEmail || ticket.business?.email || ticket.user?.email
      : null;
  const notifyPhone =
    input.senderRole === Role.ADMIN ? ticket.business?.phone || ticket.user?.phone : null;

  if (notifyEmail) {
    void notifyUserTicketUpdate(
      prisma,
      notifyEmail,
      notifyPhone,
      ticket.ticketRef,
      `New reply on your ticket: ${body.slice(0, 200)}`,
    );
  }

  if (input.senderRole === Role.BUSINESS || input.senderRole === Role.USER) {
    const fromLabel = input.senderRole === Role.BUSINESS ? 'Business' : 'Customer';
    void notifyPlatformAdmins(prisma, {
      type: 'SUPPORT_TICKET_REPLY',
      title: `${fromLabel} replied on ${ticket.ticketRef}`,
      body: body.slice(0, 300),
    });
  } else if (input.senderRole === Role.ADMIN) {
    if (ticket.userId) {
      const u = await prisma.user.findUnique({
        where: { id: ticket.userId },
        select: { id: true, email: true, phone: true, role: true },
      });
      if (u && u.role === Role.USER) {
        void notifyCustomerUser(prisma, u, {
          type: 'SUPPORT_TICKET_REPLY',
          title: `Reply on ${ticket.ticketRef}`,
          body: body.slice(0, 400),
        });
      }
    }
    if (ticket.business?.email) {
      void notifyBusinessAccount(prisma, ticket.business, {
        type: 'SUPPORT_TICKET_REPLY',
        title: `Reply on ${ticket.ticketRef}`,
        body: body.slice(0, 400),
      });
    }
  }

  return { ticket, message: msg };
}

export function mapSupportTicketRow(
  ticket: {
    id: string;
    ticketRef: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    businessId: string | null;
    userId: string | null;
    createdByRole: Role;
    requesterName: string;
    requesterEmail: string | null;
    screenshotUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt: Date | null;
    business?: { name: string; merchantNumber: number | null; email: string } | null;
    user?: { name: string; email: string } | null;
    messages?: Array<{
      id: string;
      body: string;
      senderRole: Role;
      senderName: string | null;
      createdAt: Date;
      attachmentUrl: string | null;
    }>;
  },
  options?: { includeInlineAttachments?: boolean },
) {
  const includeInline = options?.includeInlineAttachments === true;
  return {
    id: ticket.id,
    ticketRef: ticket.ticketRef,
    subject: ticket.subject,
    category: ticket.category,
    status: ticket.status,
    priority: ticket.priority,
    businessId: ticket.businessId,
    businessName: ticket.business?.name ?? null,
    merchantNumber: ticket.business?.merchantNumber ?? null,
    userId: ticket.userId,
    requesterName: ticket.requesterName,
    requesterEmail: ticket.requesterEmail,
    screenshotUrl: attachmentForApi(ticket.screenshotUrl, includeInline),
    hasScreenshot:
      hasInlineAttachment(ticket.screenshotUrl) ||
      Boolean(ticket.messages?.some((m) => hasInlineAttachment(m.attachmentUrl))),
    createdByRole: ticket.createdByRole,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    messageCount: ticket.messages?.length ?? 0,
    lastMessage: ticket.messages?.length
      ? ticket.messages[ticket.messages.length - 1].body.slice(0, 200)
      : null,
    messages: ticket.messages?.map((m) => ({
      id: m.id,
      body: m.body,
      senderRole: m.senderRole,
      senderName: m.senderName,
      attachmentUrl: attachmentForApi(m.attachmentUrl, includeInline),
      hasAttachment: hasInlineAttachment(m.attachmentUrl),
      createdAt: m.createdAt.toISOString(),
    })),
  };
}
