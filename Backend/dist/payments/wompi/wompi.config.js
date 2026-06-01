"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readWompiConfigFromEnv = readWompiConfigFromEnv;
exports.isWompiEnabledFlag = isWompiEnabledFlag;
exports.resolveWompiConfigFromRow = resolveWompiConfigFromRow;
exports.resolveWompiConfig = resolveWompiConfig;
exports.isWompiConfigured = isWompiConfigured;
function readWompiConfigFromEnv() {
    const publicKey = process.env.WOMPI_PUBLIC_KEY?.trim();
    const privateKey = process.env.WOMPI_PRIVATE_KEY?.trim();
    if (!publicKey || !privateKey)
        return null;
    const envRaw = (process.env.WOMPI_ENV || 'sandbox').trim().toLowerCase();
    const env = envRaw === 'production' ? 'production' : 'sandbox';
    return {
        publicKey,
        privateKey,
        env,
        webhookSecret: process.env.WOMPI_WEBHOOK_SECRET?.trim() || null,
    };
}
function isWompiEnabledFlag(row) {
    if (row?.wompiEnabled === false)
        return false;
    if (row?.cardPayEnabled === false)
        return false;
    return true;
}
function resolveWompiConfigFromRow(row) {
    const fromEnv = readWompiConfigFromEnv();
    if (fromEnv)
        return fromEnv;
    const publicKey = row?.wompiPublicKey?.trim();
    const privateKey = row?.wompiPrivateKey?.trim();
    if (!publicKey || !privateKey)
        return null;
    const envRaw = (row?.wompiEnv || 'sandbox').trim().toLowerCase();
    const env = envRaw === 'production' ? 'production' : 'sandbox';
    return {
        publicKey,
        privateKey,
        env,
        webhookSecret: row?.wompiWebhookSecret?.trim() || null,
    };
}
async function resolveWompiConfig(prisma) {
    const row = await prisma.systemConfig.findUnique({ where: { id: 1 } });
    if (!row || !isWompiEnabledFlag(row))
        return null;
    return resolveWompiConfigFromRow(row);
}
function isWompiConfigured(row) {
    return Boolean(resolveWompiConfigFromRow(row ?? null));
}
//# sourceMappingURL=wompi.config.js.map