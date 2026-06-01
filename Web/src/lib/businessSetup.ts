import type { Business } from '@/store/businessStore';

export type BusinessSetupField =
  | 'logo'
  | 'banner'
  | 'description'
  | 'location'
  | 'mapPin'
  | 'workingHours'
  | 'gallery';

export type BusinessSetupStatus = {
  complete: boolean;
  missing: BusinessSetupField[];
  canEnableListing: boolean;
};

const FIELD_LABELS: Record<BusinessSetupField, string> = {
  logo: 'Business logo',
  banner: 'Cover banner',
  description: 'Description (min. 10 characters)',
  location: 'Street address',
  mapPin: 'Map location (pin on map)',
  workingHours: 'Working hours',
  gallery: 'At least one gallery photo',
};

export function setupFieldLabel(field: BusinessSetupField): string {
  return FIELD_LABELS[field];
}

export function resolveSetupStatus(business: Business | null | undefined): BusinessSetupStatus {
  if (business?.setupStatus) {
    return business.setupStatus;
  }
  const missing: BusinessSetupField[] = [];
  if (!String(business?.logo || '').trim()) missing.push('logo');
  if (!String(business?.banner || '').trim()) missing.push('banner');
  if (String(business?.description || '').trim().length < 10) missing.push('description');
  if (!String(business?.location || '').trim()) missing.push('location');
  if (business?.latitude == null || business?.longitude == null) missing.push('mapPin');
  if (!String(business?.workingHours || '').trim()) missing.push('workingHours');
  const gallery = business?.images ?? [];
  if (gallery.filter((u) => String(u || '').trim()).length < 1) missing.push('gallery');
  const status = (business?.status || '').toLowerCase();
  const complete = business?.setupStatus?.complete ?? missing.length === 0;
  return {
    complete,
    missing,
    canEnableListing: complete && status === 'active',
  };
}

export function needsInitialBusinessSetup(business: Business | null | undefined): boolean {
  if (!business) return false;
  const status = (business.status || '').toLowerCase();
  if (status !== 'active') return false;
  return !resolveSetupStatus(business).complete;
}
