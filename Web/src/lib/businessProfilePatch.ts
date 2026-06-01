import type { Business } from '@/store/businessStore';
import type { BusinessRegistrationDetails } from '@/lib/businessJoinConfig';
import { categoryKeysForPartnerType, inferPartnerTypeId } from '@/lib/partnerBusinessTypes';

export type ProfileFormPayload = {
  name: string;
  owner: string;
  taxId: string;
  description: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  socialYoutube?: string;
  socialInstagram?: string;
  socialX?: string;
  socialTiktok?: string;
  logo?: string;
  banner?: string;
};

export function buildBusinessProfilePatch(input: {
  business: Business;
  form: ProfileFormPayload;
  businessTypeId: string;
  categoryKeys: string[];
  registrationDetails: BusinessRegistrationDetails;
  amenityKeys: string[];
  galleryImages: string[];
  workingHoursJson: string;
  logo: string;
  banner: string;
}): Record<string, unknown> {
  const typeId =
    input.businessTypeId ||
    inferPartnerTypeId(input.business.categoryKeys, input.registrationDetails.businessType) ||
    input.business.businessType ||
    '';

  const keys =
    input.categoryKeys.length > 0
      ? input.categoryKeys
      : typeId
        ? categoryKeysForPartnerType(typeId)
        : input.business.categoryKeys ?? [];

  const reg: BusinessRegistrationDetails = {
    ...input.registrationDetails,
    businessType: typeId || input.registrationDetails.businessType,
    latitude: input.registrationDetails.latitude ?? input.business.latitude ?? null,
    longitude: input.registrationDetails.longitude ?? input.business.longitude ?? null,
  };

  const patch: Record<string, unknown> = {
    name: input.form.name.trim(),
    owner: input.form.owner.trim(),
    taxId: input.form.taxId.trim(),
    description: input.form.description.trim(),
    location: input.form.location.trim(),
    contactEmail: input.form.contactEmail.trim(),
    contactPhone: input.form.contactPhone.trim(),
    socialYoutube: input.form.socialYoutube?.trim() || '',
    socialInstagram: input.form.socialInstagram?.trim() || '',
    socialX: input.form.socialX?.trim() || '',
    socialTiktok: input.form.socialTiktok?.trim() || '',
    amenityKeys: input.amenityKeys,
    workingHours: input.workingHoursJson,
    registrationDetails: reg,
    latitude: reg.latitude ?? undefined,
    longitude: reg.longitude ?? undefined,
  };

  if (typeId) {
    patch.businessType = typeId;
    patch.categoryKeys = keys;
  }

  if (input.logo.trim()) patch.logo = input.logo.trim();
  if (input.banner.trim()) patch.banner = input.banner.trim();
  patch.images = input.galleryImages.filter((u) => u.trim()).slice(0, 12);

  return patch;
}
