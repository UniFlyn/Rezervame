"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SITE_STATUS_S3_KEY = void 0;
exports.publicSiteStatusFromRow = publicSiteStatusFromRow;
exports.publishPublicSiteStatus = publishPublicSiteStatus;
exports.SITE_STATUS_S3_KEY = 'platform/site-status.json';
function publicSiteStatusFromRow(row) {
    const branding = typeof row?.platformBranding === 'string' && row.platformBranding.trim()
        ? row.platformBranding.trim()
        : 'Rezervame';
    return {
        maintenanceMode: row?.maintenanceMode === true,
        platformBranding: branding,
        updatedAt: new Date().toISOString(),
    };
}
async function publishPublicSiteStatus(prisma, s3, row) {
    let source = row;
    if (!source) {
        const cfg = await prisma.systemConfig.findUnique({ where: { id: 1 } });
        source = (cfg ?? {});
    }
    const payload = publicSiteStatusFromRow(source);
    return s3.uploadJsonAtFixedKey(payload, exports.SITE_STATUS_S3_KEY);
}
//# sourceMappingURL=public-site-status.util.js.map