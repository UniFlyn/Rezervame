"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessDiscoveryWhere = void 0;
exports.evaluateBusinessProfileSetup = evaluateBusinessProfileSetup;
exports.isBusinessDiscoverable = isBusinessDiscoverable;
function evaluateBusinessProfileSetup(b) {
    const missing = [];
    if (!String(b.logoUrl || '').trim())
        missing.push('logo');
    if (!String(b.bannerUrl || '').trim())
        missing.push('banner');
    if (String(b.description || '').trim().length < 10)
        missing.push('description');
    if (!String(b.address || '').trim())
        missing.push('location');
    if (b.latitude == null || b.longitude == null)
        missing.push('mapPin');
    if (!String(b.workingHours || '').trim())
        missing.push('workingHours');
    const gallery = Array.isArray(b.images) ? b.images : [];
    if (gallery.filter((u) => String(u || '').trim()).length < 1)
        missing.push('gallery');
    const complete = missing.length === 0;
    const status = (b.status || '').toLowerCase().trim();
    const canEnableListing = complete && status === 'active';
    return {
        complete,
        missing,
        canEnableListing,
    };
}
function isBusinessDiscoverable(b) {
    if ((b.status || '').toLowerCase().trim() !== 'active')
        return false;
    if (!b.profileSetupComplete)
        return false;
    return Boolean(b.listingVisible);
}
exports.businessDiscoveryWhere = {
    status: 'active',
    profileSetupComplete: true,
    listingVisible: true,
};
//# sourceMappingURL=business-listing.util.js.map