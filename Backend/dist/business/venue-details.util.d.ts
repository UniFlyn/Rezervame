import type { Business } from '@prisma/client';
export type VenueDetailRow = {
    label: string;
    value: string;
};
export type VenueDetailSection = {
    title: string;
    rows: VenueDetailRow[];
};
export declare function buildPublicVenueDetails(business: Pick<Business, 'registrationDetails' | 'latitude' | 'longitude' | 'address' | 'description' | 'workingHours' | 'categoryLabels' | 'amenityKeys'>): {
    sections: VenueDetailSection[];
    photoUrls: string[];
};
export declare function buildAdminRegistrationSections(registrationDetails: unknown): VenueDetailSection[];
export declare function collectRegistrationPhotoUrls(registrationDetails: unknown): string[];
