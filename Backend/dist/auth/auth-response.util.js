"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAuthResponse = buildAuthResponse;
const security_policy_util_1 = require("../config/security-policy.util");
const session_util_1 = require("./session.util");
async function buildAuthResponse(prisma, user) {
    const policy = await (0, security_policy_util_1.loadSecurityPolicy)(prisma);
    const token = (0, session_util_1.signSessionToken)({
        sub: user.id,
        role: user.role,
        email: user.email,
    }, policy.sessionTimeoutMinutes);
    const { password: _pw, ...safe } = user;
    return {
        token,
        user: safe,
        sessionExpiresAt: (0, security_policy_util_1.sessionExpiresAtIso)(policy.sessionTimeoutMinutes),
        security: {
            minPasswordLength: policy.minPasswordLength,
            sessionTimeoutMinutes: policy.sessionTimeoutMinutes,
        },
    };
}
//# sourceMappingURL=auth-response.util.js.map