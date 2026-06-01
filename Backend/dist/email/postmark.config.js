"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPostmarkConfigFromEnv = readPostmarkConfigFromEnv;
exports.readPostmarkConfig = readPostmarkConfig;
exports.isPostmarkConfigured = isPostmarkConfigured;
function readPostmarkConfigFromEnv() {
    const apiKey = process.env.POSTMARK_API_KEY?.trim();
    if (!apiKey)
        return null;
    return {
        apiKey,
        fromEmail: process.env.POSTMARK_FROM_EMAIL?.trim() || 'noreply@rezervame.com',
        replyTo: process.env.POSTMARK_REPLY_TO?.trim() || 'soporte@rezervame.com',
        messageStream: process.env.POSTMARK_MESSAGE_STREAM?.trim() || 'outbound',
        webhookToken: process.env.POSTMARK_WEBHOOK_TOKEN?.trim() || null,
    };
}
function readPostmarkConfig() {
    return readPostmarkConfigFromEnv();
}
function isPostmarkConfigured() {
    return Boolean(process.env.POSTMARK_API_KEY?.trim());
}
//# sourceMappingURL=postmark.config.js.map