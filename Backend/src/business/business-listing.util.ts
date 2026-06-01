import type { Business } from '@prisma/client';

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

export function evaluateBusinessProfileSetup(
  b: Pick<
    Business,
    | 'logoUrl'
    | 'bannerUrl'
    | 'description'
    | 'address'
    | 'latitude'
    | 'longitude'
    | 'workingHours'
    | 'images'
    | 'status'
    | 'profileSetupComplete'
  >,
): BusinessSetupStatus {
  const missing: BusinessSetupField[] = [];
  if (!String(b.logoUrl || '').trim()) missing.push('logo');
  if (!String(b.bannerUrl || '').trim()) missing.push('banner');
  if (String(b.description || '').trim().length < 10) missing.push('description');
  if (!String(b.address || '').trim()) missing.push('location');
  if (b.latitude == null || b.longitude == null) missing.push('mapPin');
  if (!String(b.workingHours || '').trim()) missing.push('workingHours');
  const gallery = Array.isArray(b.images) ? b.images : [];
  if (gallery.filter((u) => String(u || '').trim()).length < 1) missing.push('gallery');

  const complete = missing.length === 0;
  const status = (b.status || '').toLowerCase().trim();
  const canEnableListing = complete && status === 'active';

  return {
    complete,
    missing,
    canEnableListing,
  };
}

/** Customer-facing discovery (home, search, favorites). */
export function isBusinessDiscoverable(
  b: Pick<Business, 'status' | 'listingVisible' | 'profileSetupComplete'>,
): boolean {
  if ((b.status || '').toLowerCase().trim() !== 'active') return false;
  if (!b.profileSetupComplete) return false;
  return Boolean(b.listingVisible);
}

export const businessDiscoveryWhere = {
  status: 'active',
  profileSetupComplete: true,
  listingVisible: true,
} as const;
