"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSecurityPolicy = loadSecurityPolicy;
exports.passwordPolicyMessage = passwordPolicyMessage;
exports.assertPasswordMeetsPolicy = assertPasswordMeetsPolicy;
exports.sessionExpiresAtIso = sessionExpiresAtIso;
exports.maskEmailForDisplay = maskEmailForDisplay;
const common_1 = require("@nestjs/common");
const DEFAULTS = {
    minPasswordLength: 8,
    sessionTimeoutMinutes: 60,
    adminTwoFactorRequired: true,
};
function clampInt(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
}
async function loadSecurityPolicy(prisma) {
    try {
        const row = await prisma.systemConfig.findUnique({
            where: { id: 1 },
            select: {
                minPasswordLength: true,
                sessionTimeout: true,
                twoFactorMandatory: true,
            },
        });
        if (!row)
            return { ...DEFAULTS };
        return {
            minPasswordLength: clampInt(row.minPasswordLength, 4, 128, DEFAULTS.minPasswordLength),
            sessionTimeoutMinutes: clampInt(row.sessionTimeout, 5, 10_080, DEFAULTS.sessionTimeoutMinutes),
            adminTwoFactorRequired: row.twoFactorMandatory !== false,
        };
    }
    catch {
        return { ...DEFAULTS };
    }
}
function passwordPolicyMessage(minLength) {
    return `Password must be at least ${minLength} characters.`;
}
function assertPasswordMeetsPolicy(password, policy) {
    const plain = (password || '').trim();
    if (plain.length < policy.minPasswordLength) {
        throw new common_1.BadRequestException(passwordPolicyMessage(policy.minPasswordLength));
    }
}
function sessionExpiresAtIso(sessionTimeoutMinutes, from = new Date()) {
    return new Date(from.getTime() + sessionTimeoutMinutes * 60_000).toISOString();
}
function maskEmailForDisplay(email) {
    const [local, domain] = email.split('@');
    if (!domain || !local)
        return email;
    if (local.length <= 2)
        return `${local[0] ?? ''}*@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
}
//# sourceMappingURL=security-policy.util.js.map