"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractBearerToken = extractBearerToken;
exports.getUserFromAuth = getUserFromAuth;
exports.requireUser = requireUser;
exports.requireBusinessOwner = requireBusinessOwner;
exports.canAccessBusinessMerchantSession = canAccessBusinessMerchantSession;
exports.isBusinessPubliclyVisible = isBusinessPubliclyVisible;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const session_util_1 = require("./auth/session.util");
const business_listing_util_1 = require("./business/business-listing.util");
function extractBearerToken(authorization) {
    if (!authorization)
        return null;
    const m = authorization.match(/^Bearer\s+(.+)$/i);
    return m ? m[1].trim() : null;
}
async function getUserFromAuth(prisma, authorization) {
    const token = extractBearerToken(authorization);
    if (!token)
        return null;
    const jwtPayload = (0, session_util_1.verifySessionToken)(token);
    if (jwtPayload?.sub) {
        return prisma.user.findUnique({ where: { id: jwtPayload.sub } });
    }
    const legacyId = (0, session_util_1.userIdFromLegacyToken)(token);
    if (legacyId) {
        return prisma.user.findUnique({ where: { id: legacyId } });
    }
    return null;
}
async function requireUser(prisma, authorization, allowed) {
    const user = await getUserFromAuth(prisma, authorization);
    if (!user || !allowed.includes(user.role)) {
        throw new common_1.UnauthorizedException('Invalid or missing session');
    }
    if (user.role === client_1.Role.USER && (user.status || '').toLowerCase() === 'blocked') {
        throw new common_1.ForbiddenException('Account suspended');
    }
    return user;
}
async function requireBusinessOwner(prisma, authorization, businessId) {
    const user = await requireUser(prisma, authorization, [client_1.Role.BUSINESS]);
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business || business.email !== user.email) {
        throw new common_1.ForbiddenException('Not allowed for this business');
    }
    return { user, businessId };
}
function isBusinessPanelPrivileged(user, business) {
    if (!user)
        return false;
    if (user.role === client_1.Role.ADMIN)
        return true;
    if (user.role === client_1.Role.BUSINESS && business.email === user.email)
        return true;
    return false;
}
async function canAccessBusinessMerchantSession(prisma, business, authorization) {
    const user = await getUserFromAuth(prisma, authorization);
    if (!isBusinessPanelPrivileged(user, business))
        return false;
    const status = (business.status || '').toLowerCase().trim();
    if (user?.role === client_1.Role.ADMIN)
        return true;
    return status === 'active' || status === 'pending';
}
async function isBusinessPubliclyVisible(prisma, business, authorization) {
    const user = await getUserFromAuth(prisma, authorization);
    if (isBusinessPanelPrivileged(user, business)) {
        const status = (business.status || '').toLowerCase().trim();
        if (user?.role === client_1.Role.ADMIN)
            return status !== 'rejected';
        if (user?.role === client_1.Role.BUSINESS) {
            if (status === 'pending')
                return true;
            if (status === 'active')
                return true;
        }
        return false;
    }
    return (0, business_listing_util_1.isBusinessDiscoverable)({
        status: business.status ?? '',
        listingVisible: Boolean(business.listingVisible),
        profileSetupComplete: Boolean(business.profileSetupComplete),
    });
}
//# sourceMappingURL=auth.helpers.js.map