import type { Business } from '@prisma/client';
export declare function partnerTypeIdFromBusiness(categoryKeys: string[] | null | undefined, registrationDetails: unknown): string;
export declare function displayLabelsForCategoryKeys(categoryKeys: string[] | null | undefined, registrationDetails?: unknown): string[];
export declare function displayCategoryLabelsForBusiness(b: Pick<Business, 'categoryLabels' | 'categoryLabel' | 'categoryKeys' | 'registrationDetails'>): string[];
export declare function categoryKeysAndLabelsForPartner(businessTypeId: string, fallbackKeys?: string[] | null): {
    categoryKeys: string[];
    categoryLabels: string[];
};
