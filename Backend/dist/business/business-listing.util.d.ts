import type { Business } from '@prisma/client';
export type BusinessSetupField = 'logo' | 'banner' | 'description' | 'location' | 'mapPin' | 'workingHours' | 'gallery';
export type BusinessSetupStatus = {
    complete: boolean;
    missing: BusinessSetupField[];
    canEnableListing: boolean;
};
export declare function evaluateBusinessProfileSetup(b: Pick<Business, 'logoUrl' | 'bannerUrl' | 'description' | 'address' | 'latitude' | 'longitude' | 'workingHours' | 'images' | 'status' | 'profileSetupComplete'>): BusinessSetupStatus;
export declare function isBusinessDiscoverable(b: Pick<Business, 'status' | 'listingVisible' | 'profileSetupComplete'>): boolean;
export declare const businessDiscoveryWhere: {
    readonly status: "active";
    readonly profileSetupComplete: true;
    readonly listingVisible: true;
};
