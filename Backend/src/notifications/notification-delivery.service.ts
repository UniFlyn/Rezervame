import { PrismaService } from '../prisma.service';
import { resolvePostmarkConfig } from '../config/system-integration.config';
import { postmarkSendRaw } from '../email/email.service';
import type { SendTemplateEmailOptions } from '../email/interfaces/email-options.interface';
import { postmarkSendWithTemplate } from '../email/email.service';

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

export async function loadMessagingConfig(prisma: PrismaService): Promise<EmailConfig & SmsConfig & {
  adminNotifyEmail: string | null;
  notifyNewTicketEmail: boolean;
  notifyNewTicketSms: boolean;
}> {
  const row = await prisma.systemConfig.findUnique({ where: { id: 1 } });
  return {
    emailEnabled: row?.emailEnabled ?? false,
    smtpHost: row?.smtpHost ?? null,
    smtpPort: row?.smtpPort ?? 587,
    smtpSecure: row?.smtpSecure ?? false,
    smtpUser: row?.smtpUser ?? null,
    smtpPass: row?.smtpPass ?? null,
    emailFrom: row?.emailFrom ?? null,
    smsEnabled: row?.smsEnabled ?? false,
    twilioAccountSid: row?.twilioAccountSid ?? null,
    twilioAuthToken: row?.twilioAuthToken ?? null,
    twilioFromNumber: row?.twilioFromNumber ?? null,
    adminNotifyEmail: row?.adminNotifyEmail ?? null,
    notifyNewTicketEmail: row?.notifyNewTicketEmail ?? true,
    notifyNewTicketSms: row?.notifyNewTicketSms ?? false,
  };
}

async function logDelivery(
  prisma: PrismaService,
  channel: string,
  recipient: string,
  subject: string | null,
  body: string,
  status: string,
  error?: string,
  meta?: string,
): Promise<void> {
  try {
    await prisma.notificationDelivery.create({
      data: { channel, recipient, subject, body: body.slice(0, 8000), status, error, meta },
    });
  } catch {
    // table may not exist during migration
  }
}

/** Send via Postmark template alias (production). */
export async function sendEmailWithTemplate(
  prisma: PrismaService,
  options: SendTemplateEmailOptions,
): Promise<{ ok: boolean; skipped?: boolean; error?: string; messageId?: string }> {
  const recipient = options.to.trim();
  if (!recipient) return { ok: false, error: 'Missing recipient' };

  if (!(await resolvePostmarkConfig(prisma))) {
    await logDelivery(
      prisma,
      'email',
      recipient,
      options.templateAlias,
      JSON.stringify(options.templateModel).slice(0, 2000),
      'skipped',
      'Postmark not configured',
    );
    return { ok: true, skipped: true };
  }

  try {
    const result = await postmarkSendWithTemplate(prisma, { ...options, to: recipient });
    if ('skipped' in result) {
      return { ok: true, skipped: true };
    }
    await logDelivery(
      prisma,
      'email',
      recipient,
      options.templateAlias,
      JSON.stringify(options.templateModel).slice(0, 2000),
      'sent',
      undefined,
      result.MessageID,
    );
    return { ok: true, messageId: result.MessageID };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logDelivery(
      prisma,
      'email',
      recipient,
      options.templateAlias,
      JSON.stringify(options.templateModel).slice(0, 2000),
      'failed',
      msg,
    );
    return { ok: false, error: msg };
  }
}

export async function sendEmail(
  prisma: PrismaService,
  to: string,
  subject: string,
  html: string,
  text?: string,
): Promise<{ ok: boolean; skipped?: boolean; error?: string; messageId?: string }> {
  const recipient = to.trim();
  if (!recipient) return { ok: false, error: 'Missing recipient' };

  if (!(await resolvePostmarkConfig(prisma))) {
    await logDelivery(
      prisma,
      'email',
      recipient,
      subject,
      text || html,
      'skipped',
      'Postmark not configured',
    );
    console.log(`[email:skipped] To: ${recipient} | ${subject}`);
    return { ok: true, skipped: true };
  }

  try {
    const result = await postmarkSendRaw(prisma, {
      to: recipient,
      subject,
      htmlBody: html,
      textBody: text,
    });
    if ('skipped' in result) {
      return { ok: true, skipped: true };
    }
    await logDelivery(prisma, 'email', recipient, subject, text || html, 'sent', undefined, result.MessageID);
    return { ok: true, messageId: result.MessageID };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logDelivery(prisma, 'email', recipient, subject, text || html, 'failed', msg);
    console.error('[email:postmark-failed]', msg);
    return { ok: false, error: msg };
  }
}

export async function sendSms(
  prisma: PrismaService,
  to: string,
  body: string,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const cfg = await loadMessagingConfig(prisma);
  const phone = to.replace(/\s/g, '');
  if (!phone) return { ok: false, error: 'Missing phone' };

  if (!cfg.smsEnabled || !cfg.twilioAccountSid || !cfg.twilioAuthToken || !cfg.twilioFromNumber) {
    await logDelivery(prisma, 'sms', phone, null, body, 'skipped', 'SMS not configured');
    console.log(`[sms:skipped] To: ${phone} | ${body.slice(0, 80)}`);
    return { ok: true, skipped: true };
  }

  try {
    const auth = Buffer.from(`${cfg.twilioAccountSid}:${cfg.twilioAuthToken}`).toString('base64');
    const params = new URLSearchParams({
      To: phone.startsWith('+') ? phone : `+${phone}`,
      From: cfg.twilioFromNumber,
      Body: body.slice(0, 1600),
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${cfg.twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
    );
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText.slice(0, 500));
    }
    await logDelivery(prisma, 'sms', phone, null, body, 'sent');
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logDelivery(prisma, 'sms', phone, null, body, 'failed', msg);
    console.error('[sms:failed]', msg);
    return { ok: false, error: msg };
  }
}

export async function notifyAdminNewTicket(
  prisma: PrismaService,
  ticket: { ticketRef: string; subject: string; requesterName: string; category: string },
): Promise<void> {
  const cfg = await loadMessagingConfig(prisma);
  const adminEmail = cfg.adminNotifyEmail?.trim();
  const summary = `New support ticket ${ticket.ticketRef}: ${ticket.subject} (${ticket.category}) from ${ticket.requesterName}`;

  if (cfg.notifyNewTicketEmail && adminEmail) {
    await sendEmail(
      prisma,
      adminEmail,
      `[Rezervame] ${ticket.ticketRef} — ${ticket.subject}`,
      `<p>${summary}</p><p>Review in Admin → Support.</p>`,
      summary,
    );
  }

  if (cfg.notifyNewTicketSms && adminEmail) {
    await sendSms(prisma, adminEmail, summary.slice(0, 300));
  }
}

export async function notifyUserTicketUpdate(
  prisma: PrismaService,
  email: string | null | undefined,
  phone: string | null | undefined,
  ticketRef: string,
  message: string,
): Promise<void> {
  if (email) {
    await sendEmail(
      prisma,
      email,
      `[Rezervame] Update on ${ticketRef}`,
      `<p>${message}</p>`,
      message,
    );
  }
  if (phone) {
    await sendSms(prisma, phone, `${ticketRef}: ${message}`.slice(0, 300));
  }
}
