import { PrismaService } from '../prisma.service';
import type { SendTemplateEmailOptions } from '../email/interfaces/email-options.interface';
export type EmailConfig = {
    emailEnabled: boolean;
    smtpHost: string | null;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string | null;
    smtpPass: string | null;
    emailFrom: string | null;
};
export type SmsConfig = {
    smsEnabled: boolean;
    twilioAccountSid: string | null;
    twilioAuthToken: string | null;
    twilioFromNumber: string | null;
};
export declare function loadMessagingConfig(prisma: PrismaService): Promise<EmailConfig & SmsConfig & {
    adminNotifyEmail: string | null;
    notifyNewTicketEmail: boolean;
    notifyNewTicketSms: boolean;
}>;
export declare function sendEmailWithTemplate(prisma: PrismaService, options: SendTemplateEmailOptions): Promise<{
    ok: boolean;
    skipped?: boolean;
    error?: string;
    messageId?: string;
}>;
export declare function sendEmail(prisma: PrismaService, to: string, subject: string, html: string, text?: string): Promise<{
    ok: boolean;
    skipped?: boolean;
    error?: string;
    messageId?: string;
}>;
export declare function sendSms(prisma: PrismaService, to: string, body: string): Promise<{
    ok: boolean;
    skipped?: boolean;
    error?: string;
}>;
export declare function notifyAdminNewTicket(prisma: PrismaService, ticket: {
    ticketRef: string;
    subject: string;
    requesterName: string;
    category: string;
}): Promise<void>;
export declare function notifyUserTicketUpdate(prisma: PrismaService, email: string | null | undefined, phone: string | null | undefined, ticketRef: string, message: string): Promise<void>;
