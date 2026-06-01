"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupportTicket = createSupportTicket;
exports.addSupportTicketReply = addSupportTicketReply;
exports.mapSupportTicketRow = mapSupportTicketRow;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const notification_delivery_service_1 = require("../notifications/notification-delivery.service");
const notification_hub_service_1 = require("../notifications/notification-hub.service");
function safeAttachmentUrl(url) {
    if (typeof url !== 'string')
        return null;
    const s = url.trim();
    if (!s)
        return null;
    if (s.startsWith('data:') && s.length > 1_500_000)
        return null;
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image/'))
        return s;
    return null;
}
function attachmentForApi(url, includeInline) {
    if (!url?.trim())
        return null;
    const s = url.trim();
    if (s.startsWith('http://') || s.startsWith('https://'))
        return s;
    if (includeInline && s.startsWith('data:image/'))
        return s;
    return null;
}
function hasInlineAttachment(url) {
    return Boolean(url?.trim().startsWith('data:image/'));
}
async function nextTicketRef(prisma) {
    const count = await prisma.supportTicket.count();
    return `TKT-${String(count + 1).padStart(6, '0')}`;
}
async function createSupportTicket(prisma, input) {
    const subject = String(input.subject || '').trim();
    const message = String(input.message || '').trim();
    if (subject.length < 3)
        throw new common_1.BadRequestException('Subject must be at least 3 characters');
    if (message.length < 8)
        throw new common_1.BadRequestException('Message must be at least 8 characters');
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
    const fromLabel = input.createdByRole === client_1.Role.BUSINESS
        ? 'Business'
        : input.createdByRole === client_1.Role.USER
            ? 'Customer'
            : String(input.createdByRole);
    void (0, notification_hub_service_1.notifyPlatformAdmins)(prisma, {
        type: 'SUPPORT_TICKET',
        title: `${fromLabel} support: ${ticket.subject}`,
        body: `${ticket.requesterName} (${ticket.ticketRef}) — ${ticket.category}`,
        emailSubject: `[Rezervame] ${ticket.ticketRef} — ${ticket.subject}`,
    });
    if (input.requesterEmail) {
        void (0, notification_delivery_service_1.notifyUserTicketUpdate)(prisma, input.requesterEmail, input.requesterPhone, ticket.ticketRef, 'We received your support request and will respond shortly.');
    }
    return ticket;
}
async function addSupportTicketReply(prisma, ticketId, input) {
    const body = String(input.body || '').trim();
    if (body.length < 1)
        throw new common_1.BadRequestException('Reply cannot be empty');
    const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: { business: true, user: true },
    });
    if (!ticket)
        throw new common_1.BadRequestException('Ticket not found');
    const msg = await prisma.supportMessage.create({
        data: {
            ticketId,
            body: body.slice(0, 8000),
            senderRole: input.senderRole,
            senderName: input.senderName?.slice(0, 120) || null,
            attachmentUrl: safeAttachmentUrl(input.attachmentUrl),
        },
    });
    const nextStatus = input.senderRole === client_1.Role.ADMIN
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
    const notifyEmail = input.senderRole === client_1.Role.ADMIN
        ? ticket.requesterEmail || ticket.business?.email || ticket.user?.email
        : null;
    const notifyPhone = input.senderRole === client_1.Role.ADMIN ? ticket.business?.phone || ticket.user?.phone : null;
    if (notifyEmail) {
        void (0, notification_delivery_service_1.notifyUserTicketUpdate)(prisma, notifyEmail, notifyPhone, ticket.ticketRef, `New reply on your ticket: ${body.slice(0, 200)}`);
    }
    if (input.senderRole === client_1.Role.BUSINESS || input.senderRole === client_1.Role.USER) {
        const fromLabel = input.senderRole === client_1.Role.BUSINESS ? 'Business' : 'Customer';
        void (0, notification_hub_service_1.notifyPlatformAdmins)(prisma, {
            type: 'SUPPORT_TICKET_REPLY',
            title: `${fromLabel} replied on ${ticket.ticketRef}`,
            body: body.slice(0, 300),
        });
    }
    else if (input.senderRole === client_1.Role.ADMIN) {
        if (ticket.userId) {
            const u = await prisma.user.findUnique({
                where: { id: ticket.userId },
                select: { id: true, email: true, phone: true, role: true },
            });
            if (u && u.role === client_1.Role.USER) {
                void (0, notification_hub_service_1.notifyCustomerUser)(prisma, u, {
                    type: 'SUPPORT_TICKET_REPLY',
                    title: `Reply on ${ticket.ticketRef}`,
                    body: body.slice(0, 400),
                });
            }
        }
        if (ticket.business?.email) {
            void (0, notification_hub_service_1.notifyBusinessAccount)(prisma, ticket.business, {
                type: 'SUPPORT_TICKET_REPLY',
                title: `Reply on ${ticket.ticketRef}`,
                body: body.slice(0, 400),
            });
        }
    }
    return { ticket, message: msg };
}
function mapSupportTicketRow(ticket, options) {
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
        hasScreenshot: hasInlineAttachment(ticket.screenshotUrl) ||
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
//# sourceMappingURL=support-ticket.util.js.map