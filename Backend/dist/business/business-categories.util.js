"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partnerTypeIdFromBusiness = partnerTypeIdFromBusiness;
exports.displayLabelsForCategoryKeys = displayLabelsForCategoryKeys;
exports.displayCategoryLabelsForBusiness = displayCategoryLabelsForBusiness;
exports.categoryKeysAndLabelsForPartner = categoryKeysAndLabelsForPartner;
const partner_business_types_1 = require("../config/partner-business-types");
function asRecord(json) {
    if (!json || typeof json !== 'object' || Array.isArray(json))
        return null;
    return json;
}
function partnerTypeIdFromBusiness(categoryKeys, registrationDetails) {
    const rd = asRecord(registrationDetails);
    const fromReg = String(rd?.businessType ?? '').trim().toLowerCase();
    if (fromReg && partner_business_types_1.PARTNER_BUSINESS_TYPES.some((p) => p.id === fromReg))
        return fromReg;
    const keys = (0, partner_business_types_1.normalizeCategoryKeys)(categoryKeys);
    const keySig = [...keys].sort().join(',');
    for (const p of partner_business_types_1.PARTNER_BUSINESS_TYPES) {
        const sig = [...p.categoryKeys].sort().join(',');
        if (sig === keySig)
            return p.id;
    }
    for (const p of partner_business_types_1.PARTNER_BUSINESS_TYPES) {
        if (p.categoryKeys.every((k) => keys.includes(k)))
            return p.id;
    }
    if (keys.includes('barber'))
        return 'barberia';
    if (keys.includes('nailCare'))
        return 'nails';
    if (keys.includes('tattoo'))
        return 'tattoo';
    if (keys.includes('estetica'))
        return 'estetica';
    if (keys.includes('dermatology'))
        return 'dermatologo';
    if (keys.includes('yoga'))
        return 'yoga';
    if (keys.includes('spaService') || keys.includes('massage'))
        return 'spa';
    if (keys.includes('hairService') || keys.includes('beautyService'))
        return 'salon';
    return '';
}
function displayLabelsForCategoryKeys(categoryKeys, registrationDetails) {
    const partnerId = partnerTypeIdFromBusiness(categoryKeys, registrationDetails);
    const partner = partner_business_types_1.PARTNER_BUSINESS_TYPES.find((p) => p.id === partnerId);
    if (partner)
        return [partner.labelEn];
    const keys = (0, partner_business_types_1.normalizeCategoryKeys)(categoryKeys);
    if (keys.length === 0)
        return [];
    const labels = [];
    for (const key of keys) {
        const p = partner_business_types_1.PARTNER_BUSINESS_TYPES.find((row) => row.primaryCategoryKey === key || row.categoryKeys.includes(key));
        if (p && !labels.includes(p.labelEn))
            labels.push(p.labelEn);
    }
    return labels.length ? labels : keys;
}
function displayCategoryLabelsForBusiness(b) {
    const raw = b.categoryLabels ?? [];
    const trimmed = raw.map((s) => String(s).trim()).filter(Boolean);
    if (trimmed.length > 0)
        return trimmed;
    const legacy = (b.categoryLabel || '').trim();
    if (legacy) {
        return legacy.includes(' · ')
            ? legacy.split(' · ').map((s) => s.trim()).filter(Boolean)
            : [legacy];
    }
    return displayLabelsForCategoryKeys(b.categoryKeys, b.registrationDetails);
}
function categoryKeysAndLabelsForPartner(businessTypeId, fallbackKeys) {
    const partner = partner_business_types_1.PARTNER_BUSINESS_TYPES.find((p) => p.id === businessTypeId.trim().toLowerCase());
    const categoryKeys = (0, partner_business_types_1.migrateBusinessCategoryKeys)(partner?.categoryKeys ?? fallbackKeys ?? [], businessTypeId);
    const categoryLabels = partner ? [partner.labelEn] : displayLabelsForCategoryKeys(categoryKeys);
    return { categoryKeys, categoryLabels };
}
//# sourceMappingURL=business-categories.util.js.map