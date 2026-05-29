import { Injectable, Logger } from '@nestjs/common';
import * as postmark from 'postmark';
import { readPostmarkConfig } from './postmark.config';
import type { SendRawEmailOptions, SendTemplateEmailOptions } from './interfaces/email-options.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private client: postmark.ServerClient | null = null;

  private getClient(): postmark.ServerClient | null {
    const cfg = readPostmarkConfig();
    if (!cfg) return null;
    if (!this.client) {
      this.client = new postmark.ServerClient(cfg.apiKey);
    }
    return this.client;
  }

  isConfigured(): boolean {
    return this.getClient() !== null;
  }

  async sendWithTemplate(
    options: SendTemplateEmailOptions,
  ): Promise<postmark.Models.MessageSendingResponse | { skipped: true }> {
    const cfg = readPostmarkConfig();
    const client = this.getClient();
    const to = options.to.trim();
    if (!cfg || !client || !to) {
      return { skipped: true };
    }

    try {
      const result = await client.sendEmailWithTemplate({
        From: options.from || cfg.fromEmail,
        To: to,
        ReplyTo: options.replyTo || cfg.replyTo,
        TemplateAlias: options.templateAlias,
        TemplateModel: options.templateModel,
        MessageStream: options.messageStream || cfg.messageStream,
      });
      this.logger.log(
        `Postmark template sent to ${to} | ${options.templateAlias} | ${result.MessageID}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Postmark template failed: ${options.templateAlias} → ${to}`, error);
      throw error;
    }
  }

  async sendRaw(
    options: SendRawEmailOptions,
  ): Promise<postmark.Models.MessageSendingResponse | { skipped: true }> {
    const cfg = readPostmarkConfig();
    const client = this.getClient();
    const to = options.to.trim();
    if (!cfg || !client || !to) {
      return { skipped: true };
    }

    try {
      const result = await client.sendEmail({
        From: options.from || cfg.fromEmail,
        To: to,
        ReplyTo: options.replyTo || cfg.replyTo,
        Subject: options.subject,
        HtmlBody: options.htmlBody,
        TextBody: options.textBody || options.htmlBody.replace(/<[^>]+>/g, ' ').trim(),
        MessageStream: options.messageStream || cfg.messageStream,
      });
      this.logger.log(`Postmark raw sent to ${to} | ${options.subject} | ${result.MessageID}`);
      return result;
    } catch (error) {
      this.logger.error(`Postmark raw failed: ${options.subject} → ${to}`, error);
      throw error;
    }
  }
}

/** Functional helper for modules that are not DI-based (notification-delivery). */
export async function postmarkSendRaw(
  options: SendRawEmailOptions,
): Promise<postmark.Models.MessageSendingResponse | { skipped: true }> {
  return new EmailService().sendRaw(options);
}

export async function postmarkSendWithTemplate(
  options: SendTemplateEmailOptions,
): Promise<postmark.Models.MessageSendingResponse | { skipped: true }> {
  return new EmailService().sendWithTemplate(options);
}
