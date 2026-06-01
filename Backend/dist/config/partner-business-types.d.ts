export type PartnerBusinessTypeConfig = {
    id: string;
    labelEn: string;
    labelEs: string;
    primaryCategoryKey: string;
    categoryKeys: string[];
    sortOrder: number;
};
export declare const PARTNER_BUSINESS_TYPES: PartnerBusinessTypeConfig[];
export declare const LEGACY_CATEGORY_KEYS: Set<string>;
export declare const DEDICATED_PARTNER_CATEGORY_KEYS: Set<string>;
export declare function normalizeCategoryKey(key: string): string;
export declare function normalizeCategoryKeys(keys: string[] | null | undefined): string[];
export declare function migrateBusinessCategoryKeys(categoryKeys: string[] | null | undefined, businessType?: string | null): string[];
export declare function partnerTypeByPrimaryKey(key: string): PartnerBusinessTypeConfig | undefined;
