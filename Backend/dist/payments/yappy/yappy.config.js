"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readYappyConfigFromEnv = readYappyConfigFromEnv;
exports.resolveYappyConfigFromRow = resolveYappyConfigFromRow;
exports.resolveYappyConfig = resolveYappyConfig;
exports.isYappyConfigured = isYappyConfigured;
function readYappyConfigFromEnv() {
    const merchantId = process.env.YAPPY_MERCHANT_ID?.trim();
    const secretToken = process.env.YAPPY_SECRET_TOKEN?.trim();
    if (!merchantId || !secretToken)
        return null;
    const envRaw = (process.env.YAPPY_ENV || 'sandbox').trim().toLowerCase();
    const env = envRaw === 'production' ? 'production' : 'sandbox';
    return { merchantId, secretToken, env };
}
function resolveYappyConfigFromRow(row) {
    const fromEnv = readYappyConfigFromEnv();
    if (fromEnv)
        return fromEnv;
    const merchantId = row?.yappyMerchantId?.trim();
    const secretToken = row?.yappySecretToken?.trim();
    if (!merchantId || !secretToken)
        return null;
    const envRaw = (process.env.YAPPY_ENV || 'sandbox').trim().toLowerCase();
    const env = envRaw === 'production' ? 'production' : 'sandbox';
    return { merchantId, secretToken, env };
}
async function resolveYappyConfig(prisma) {
    const row = await prisma.systemConfig.findUnique({ where: { id: 1 } });
    if (!row || row.yappyEnabled === false)
        return null;
    return resolveYappyConfigFromRow(row);
}
function isYappyConfigured(row) {
    return Boolean(resolveYappyConfigFromRow(row ?? null));
}
//# sourceMappingURL=yappy.config.js.map