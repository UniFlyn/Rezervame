import * as postmark from 'postmark';
import type { SendRawEmailOptions, SendTemplateEmailOptions } from './interfaces/email-options.interface';
import { PrismaService } from '../prisma.service';
export declare class EmailService {
    private readonly prisma;
    private readonly logger;
    private client;
    private clientKey;
    constructor(prisma: PrismaService);
    private getClient;
    isConfigured(): Promise<boolean>;
    sendWithTemplate(options: SendTemplateEmailOptions): Promise<postmark.Models.MessageSendingResponse | {
        skipped: true;
    }>;
    sendRaw(options: SendRawEmailOptions): Promise<postmark.Models.MessageSendingResponse | {
        skipped: true;
    }>;
}
export declare function postmarkSendRaw(prisma: PrismaService, options: SendRawEmailOptions): Promise<postmark.Models.MessageSendingResponse | {
    skipped: true;
}>;
export declare function postmarkSendWithTemplate(prisma: PrismaService, options: SendTemplateEmailOptions): Promise<postmark.Models.MessageSendingResponse | {
    skipped: true;
}>;
