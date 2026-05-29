export type PostmarkEnvConfig = {
  apiKey: string;
  fromEmail: string;
  replyTo: string;
  messageStream: string;
  webhookToken: string | null;
};

export function readPostmarkConfig(): PostmarkEnvConfig | null {
  const apiKey = process.env.POSTMARK_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    fromEmail: process.env.POSTMARK_FROM_EMAIL?.trim() || 'noreply@rezervame.com',
    replyTo: process.env.POSTMARK_REPLY_TO?.trim() || 'soporte@rezervame.com',
    messageStream: process.env.POSTMARK_MESSAGE_STREAM?.trim() || 'outbound',
    webhookToken: process.env.POSTMARK_WEBHOOK_TOKEN?.trim() || null,
  };
}

export function isPostmarkConfigured(): boolean {
  return Boolean(process.env.POSTMARK_API_KEY?.trim());
}
