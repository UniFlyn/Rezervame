import partnerTypesJson from './partner-business-types.json';

export type PartnerBusinessTypeConfig = {
  id: string;
  labelEn: string;
  labelEs: string;
  primaryCategoryKey: string;
  categoryKeys: string[];
  sortOrder: number;
};

export const PARTNER_BUSINESS_TYPES: PartnerBusinessTypeConfig[] = partnerTypesJson as PartnerBusinessTypeConfig[];

/** Legacy Category.key values kept on businesses for search matching (not shown as separate filters). */
export const LEGACY_CATEGORY_KEYS = new Set([
  'hairService',
  'spaService',
  'nailCare',
  'beautyService',
  'barber',
  'massage',
  'Massage',
]);

export const DEDICATED_PARTNER_CATEGORY_KEYS = new Set(['tattoo', 'yoga', 'estetica', 'dermatology']);

export function normalizeCategoryKey(key: string): string {
  const k = key.trim();
  if (k === 'Massage') return 'massage';
  return k;
}

export function normalizeCategoryKeys(keys: string[] | null | undefined): string[] {
  const out = new Set<string>();
  for (const raw of keys ?? []) {
    const k = normalizeCategoryKey(raw);
    if (k) out.add(k);
  }
  return [...out];
}

/** Map stored keys + optional registration businessType → canonical partner categoryKeys. */
export function migrateBusinessCategoryKeys(
  categoryKeys: string[] | null | undefined,
  businessType?: string | null,
): string[] {
  const type = (businessType || '').trim().toLowerCase();
  const partner = PARTNER_BUSINESS_TYPES.find((p) => p.id === type);
  if (partner) return [...partner.categoryKeys];

  let keys = normalizeCategoryKeys(categoryKeys);

  if (keys.includes('tattoo')) keys = keys.filter((k) => k !== 'beautyService');
  if (keys.includes('estetica')) keys = keys.filter((k) => k !== 'beautyService');
  if (keys.includes('dermatology')) keys = keys.filter((k) => k !== 'beautyService');
  if (keys.includes('yoga')) keys = keys.filter((k) => k !== 'spaService' && k !== 'massage');

  return keys.length ? keys : ['hairService'];
}

export function partnerTypeByPrimaryKey(key: string): PartnerBusinessTypeConfig | undefined {
  const k = normalizeCategoryKey(key);
  return PARTNER_BUSINESS_TYPES.find(
    (p) => p.primaryCategoryKey === k || p.categoryKeys.includes(k),
  );
}
