"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEDICATED_PARTNER_CATEGORY_KEYS = exports.LEGACY_CATEGORY_KEYS = exports.PARTNER_BUSINESS_TYPES = void 0;
exports.normalizeCategoryKey = normalizeCategoryKey;
exports.normalizeCategoryKeys = normalizeCategoryKeys;
exports.migrateBusinessCategoryKeys = migrateBusinessCategoryKeys;
exports.partnerTypeByPrimaryKey = partnerTypeByPrimaryKey;
const partner_business_types_json_1 = __importDefault(require("./partner-business-types.json"));
exports.PARTNER_BUSINESS_TYPES = partner_business_types_json_1.default;
exports.LEGACY_CATEGORY_KEYS = new Set([
    'hairService',
    'spaService',
    'nailCare',
    'beautyService',
    'barber',
    'massage',
    'Massage',
]);
exports.DEDICATED_PARTNER_CATEGORY_KEYS = new Set(['tattoo', 'yoga', 'estetica', 'dermatology']);
function normalizeCategoryKey(key) {
    const k = key.trim();
    if (k === 'Massage')
        return 'massage';
    return k;
}
function normalizeCategoryKeys(keys) {
    const out = new Set();
    for (const raw of keys ?? []) {
        const k = normalizeCategoryKey(raw);
        if (k)
            out.add(k);
    }
    return [...out];
}
function migrateBusinessCategoryKeys(categoryKeys, businessType) {
    const type = (businessType || '').trim().toLowerCase();
    const partner = exports.PARTNER_BUSINESS_TYPES.find((p) => p.id === type);
    if (partner)
        return [...partner.categoryKeys];
    let keys = normalizeCategoryKeys(categoryKeys);
    if (keys.includes('tattoo'))
        keys = keys.filter((k) => k !== 'beautyService');
    if (keys.includes('estetica'))
        keys = keys.filter((k) => k !== 'beautyService');
    if (keys.includes('dermatology'))
        keys = keys.filter((k) => k !== 'beautyService');
    if (keys.includes('yoga'))
        keys = keys.filter((k) => k !== 'spaService' && k !== 'massage');
    return keys.length ? keys : ['hairService'];
}
function partnerTypeByPrimaryKey(key) {
    const k = normalizeCategoryKey(key);
    return exports.PARTNER_BUSINESS_TYPES.find((p) => p.primaryCategoryKey === k || p.categoryKeys.includes(k));
}
//# sourceMappingURL=partner-business-types.js.map