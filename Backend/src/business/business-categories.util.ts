import type { Business } from '@prisma/client';
import {
  PARTNER_BUSINESS_TYPES,
  migrateBusinessCategoryKeys,
  normalizeCategoryKeys,
} from '../config/partner-business-types';

function asRecord(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  return json as Record<string, unknown>;
}

export function partnerTypeIdFromBusiness(
  categoryKeys: string[] | null | undefined,
  registrationDetails: unknown,
): string {
  const rd = asRecord(registrationDetails);
  const fromReg = String(rd?.businessType ?? '').trim().toLowerCase();
  if (fromReg && PARTNER_BUSINESS_TYPES.some((p) => p.id === fromReg)) return fromReg;

  const keys = normalizeCategoryKeys(categoryKeys);
  const keySig = [...keys].sort().join(',');
  for (const p of PARTNER_BUSINESS_TYPES) {
    const sig = [...p.categoryKeys].sort().join(',');
    if (sig === keySig) return p.id;
  }
  for (const p of PARTNER_BUSINESS_TYPES) {
    if (p.categoryKeys.every((k) => keys.includes(k))) return p.id;
  }
  if (keys.includes('barber')) return 'barberia';
  if (keys.includes('nailCare')) return 'nails';
  if (keys.includes('tattoo')) return 'tattoo';
  if (keys.includes('estetica')) return 'estetica';
  if (keys.includes('dermatology')) return 'dermatologo';
  if (keys.includes('yoga')) return 'yoga';
  if (keys.includes('spaService') || keys.includes('massage')) return 'spa';
  if (keys.includes('hairService') || keys.includes('beautyService')) return 'salon';
  return '';
}

export function displayLabelsForCategoryKeys(
  categoryKeys: string[] | null | undefined,
  registrationDetails?: unknown,
): string[] {
  const partnerId = partnerTypeIdFromBusiness(categoryKeys, registrationDetails);
  const partner = PARTNER_BUSINESS_TYPES.find((p) => p.id === partnerId);
  if (partner) return [partner.labelEn];

  const keys = normalizeCategoryKeys(categoryKeys);
  if (keys.length === 0) return [];

  const labels: string[] = [];
  for (const key of keys) {
    const p = PARTNER_BUSINESS_TYPES.find(
      (row) => row.primaryCategoryKey === key || row.categoryKeys.includes(key),
    );
    if (p && !labels.includes(p.labelEn)) labels.push(p.labelEn);
  }
  return labels.length ? labels : keys;
}

export function displayCategoryLabelsForBusiness(
  b: Pick<Business, 'categoryLabels' | 'categoryLabel' | 'categoryKeys' | 'registrationDetails'>,
): string[] {
  const raw = b.categoryLabels ?? [];
  const trimmed = raw.map((s) => String(s).trim()).filter(Boolean);
  if (trimmed.length > 0) return trimmed;
  const legacy = (b.categoryLabel || '').trim();
  if (legacy) {
    return legacy.includes(' · ')
      ? legacy.split(' · ').map((s) => s.trim()).filter(Boolean)
      : [legacy];
  }
  return displayLabelsForCategoryKeys(b.categoryKeys, b.registrationDetails);
}

export function categoryKeysAndLabelsForPartner(
  businessTypeId: string,
  fallbackKeys?: string[] | null,
): { categoryKeys: string[]; categoryLabels: string[] } {
  const partner = PARTNER_BUSINESS_TYPES.find((p) => p.id === businessTypeId.trim().toLowerCase());
  const categoryKeys = migrateBusinessCategoryKeys(
    partner?.categoryKeys ?? fallbackKeys ?? [],
    businessTypeId,
  );
  const categoryLabels = partner ? [partner.labelEn] : displayLabelsForCategoryKeys(categoryKeys);
  return { categoryKeys, categoryLabels };
}
