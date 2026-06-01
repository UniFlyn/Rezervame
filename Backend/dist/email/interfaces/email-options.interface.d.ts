import type { PostmarkTemplateAlias } from '../email.constants';
export type SendTemplateEmailOptions = {
    to: string;
    templateAlias: PostmarkTemplateAlias | string;
    templateModel: Record<string, unknown>;
    from?: string;
    replyTo?: string;
    messageStream?: string;
};
export type SendRawEmailOptions = {
    to: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    from?: string;
    replyTo?: string;
    messageStream?: string;
};
