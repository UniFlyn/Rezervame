"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePostmarkConfigFromRow = resolvePostmarkConfigFromRow;
exports.resolvePostmarkConfig = resolvePostmarkConfig;
exports.resolveS3ConfigFromRow = resolveS3ConfigFromRow;
exports.resolveS3Config = resolveS3Config;
exports.resolveStripePublishableKey = resolveStripePublishableKey;
exports.adminConfigWithEnvFallbacks = adminConfigWithEnvFallbacks;
const postmark_config_1 = require("../email/postmark.config");
const wompi_config_1 = require("../payments/wompi/wompi.config");
const yappy_config_1 = require("../payments/yappy/yappy.config");
const s3_config_1 = require("../storage/s3.config");
function resolvePostmarkConfigFromRow(row) {
    const fromEnv = (0, postmark_config_1.readPostmarkConfigFromEnv)();
    if (fromEnv)
        return fromEnv;
    const apiKey = row?.postmarkApiKey?.trim();
    if (!apiKey)
        return null;
    const r = row;
    return {
        apiKey,
        fromEmail: r.postmarkFromEmail?.trim() || 'noreply@rezervame.com',
        replyTo: r.postmarkReplyTo?.trim() || 'soporte@rezervame.com',
        messageStream: r.postmarkMessageStream?.trim() || 'outbound',
        webhookToken: r.postmarkWebhookToken?.trim() || null,
    };
}
async function resolvePostmarkConfig(prisma) {
    const row = await prisma.systemConfig.findUnique({ where: { id: 1 } });
    return resolvePostmarkConfigFromRow(row);
}
function resolveS3ConfigFromRow(row) {
    const fromEnv = (0, s3_config_1.readS3ConfigFromEnv)();
    if (fromEnv)
        return fromEnv;
    const bucket = row?.s3BucketName?.trim();
    const accessKeyId = row?.s3AccessKeyId?.trim();
    const secretAccessKey = row?.s3SecretAccessKey?.trim();
    if (!bucket || !accessKeyId || !secretAccessKey)
        return null;
    const r = row;
    const region = r.s3Region?.trim() || 'us-east-1';
    const publicBaseUrl = r.s3PublicBaseUrl?.trim().replace(/\/+$/, '') ||
        `https://${bucket}.s3.${region}.amazonaws.com`;
    return {
        region,
        bucket,
        publicBaseUrl,
        uploadPrefix: (r.s3UploadPrefix?.trim() || 'uploads').replace(/^\/+|\/+$/g, ''),
        accessKeyId,
        secretAccessKey,
    };
}
async function resolveS3Config(prisma) {
    const row = await prisma.systemConfig.findUnique({ where: { id: 1 } });
    return resolveS3ConfigFromRow(row);
}
async function resolveStripePublishableKey(prisma) {
    const fromEnv = process.env.STRIPE_PUBLISHABLE_KEY?.trim();
    if (fromEnv)
        return fromEnv;
    const row = await prisma.systemConfig.findUnique({ where: { id: 1 } });
    return row?.stripePublishableKey?.trim() || '';
}
function setAdminConfigIfEmpty(target, key, value) {
    if (!value?.trim())
        return;
    if (String(target[key] ?? '').trim())
        return;
    target[key] = value.trim();
}
function adminConfigWithEnvFallbacks(row) {
    const out = { ...(row || {}) };
    const s3 = (0, s3_config_1.readS3ConfigFromEnv)();
    if (s3) {
        setAdminConfigIfEmpty(out, 's3Region', s3.region);
        setAdminConfigIfEmpty(out, 's3BucketName', s3.bucket);
        setAdminConfigIfEmpty(out, 's3PublicBaseUrl', s3.publicBaseUrl);
        setAdminConfigIfEmpty(out, 's3UploadPrefix', s3.uploadPrefix);
        setAdminConfigIfEmpty(out, 's3AccessKeyId', s3.accessKeyId);
        setAdminConfigIfEmpty(out, 's3SecretAccessKey', s3.secretAccessKey);
    }
    const postmark = (0, postmark_config_1.readPostmarkConfigFromEnv)();
    if (postmark) {
        setAdminConfigIfEmpty(out, 'postmarkApiKey', postmark.apiKey);
        setAdminConfigIfEmpty(out, 'postmarkFromEmail', postmark.fromEmail);
        setAdminConfigIfEmpty(out, 'postmarkReplyTo', postmark.replyTo);
        setAdminConfigIfEmpty(out, 'postmarkMessageStream', postmark.messageStream);
        setAdminConfigIfEmpty(out, 'postmarkWebhookToken', postmark.webhookToken ?? undefined);
    }
    const wompi = (0, wompi_config_1.readWompiConfigFromEnv)();
    if (wompi) {
        setAdminConfigIfEmpty(out, 'wompiPublicKey', wompi.publicKey);
        setAdminConfigIfEmpty(out, 'wompiPrivateKey', wompi.privateKey);
        setAdminConfigIfEmpty(out, 'wompiEnv', wompi.env);
        setAdminConfigIfEmpty(out, 'wompiWebhookSecret', wompi.webhookSecret ?? undefined);
    }
    const yappy = (0, yappy_config_1.readYappyConfigFromEnv)();
    if (yappy) {
        setAdminConfigIfEmpty(out, 'yappyMerchantId', yappy.merchantId);
        setAdminConfigIfEmpty(out, 'yappySecretToken', yappy.secretToken);
    }
    if (out.wompiEnabled === undefined || out.wompiEnabled === null) {
        out.wompiEnabled = out.cardPayEnabled !== false;
    }
    if (out.yappyEnabled === undefined || out.yappyEnabled === null) {
        out.yappyEnabled = true;
    }
    if (out.cashPayEnabled === undefined || out.cashPayEnabled === null) {
        out.cashPayEnabled = true;
    }
    if (!String(out.wompiEnv ?? '').trim()) {
        out.wompiEnv = 'sandbox';
    }
    return out;
}
//# sourceMappingURL=system-integration.config.js.map