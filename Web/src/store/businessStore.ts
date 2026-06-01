import { create } from 'zustand';
import { apiGet, apiPatch, apiPostOptional } from '@/lib/api';
import {
  clearSessionExpiry,
  fetchSecurityPolicy,
  isSessionExpired,
  passwordLengthMessage,
  passwordTooShort,
  storeSessionExpiry,
} from '@/lib/securityPolicy';

export interface Business {
  id: string;
  name: string;
  logo: string;
  banner: string;
  /** Gallery photos for the public venue page (excludes logo). */
  images?: string[];
  description: string;
  /** Joined display string for headers and legacy UIs. */
  category: string;
  /** Multi-select business profile category labels (same order as saved). */
  categories?: string[];
  /** Category keys from signup (`Category.key`), same as join flow — scopes service types. */
  categoryKeys?: string[];
  /** Selected `Amenity.key` values — labels come from `/public/amenities`. */
  amenityKeys?: string[];
  location: string;
  contactEmail: string;
  contactPhone: string;
  /** Full profile URLs (https://…) */
  socialYoutube?: string;
  socialInstagram?: string;
  socialX?: string;
  socialTiktok?: string;
  workingHours?: string;
  balance: number;
  revenue: number;
  notifyBookingEmail?: boolean;
  notifyCancellationEmail?: boolean;
  notifyDailySummary?: boolean;
  /** Business onboarding / moderation status from API (`Business.status`). */
  status?: string;
  owner?: string;
  taxId?: string;
  /** Partner type id (`salon`, `barberia`, …) — matches registration picker. */
  businessType?: string;
  registrationDetails?: Record<string, unknown> | null;
  registrationSections?: { title: string; rows: { label: string; value: string }[] }[];
  taxPercentage?: number;
  /** `manual` = approve each booking; `automatic` = instant confirmation */
  appointmentApprovalMode?: 'manual' | 'automatic';
  cancellationAllowed?: boolean;
  cancellationHoursBefore?: number;
  cancellationPolicyMessageEn?: string;
  cancellationPolicyMessageEs?: string;
  planId?: string;
  plan?: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Merchant toggle — show on app/web when setup is complete. */
  listingVisible?: boolean;
  profileSetupComplete?: boolean;
  setupStatus?: {
    complete: boolean;
    missing: Array<
      'logo' | 'banner' | 'description' | 'location' | 'mapPin' | 'workingHours' | 'gallery'
    >;
    canEnableListing: boolean;
  };
}

type BusinessPatch = Partial<Business> & {
  businessType?: string;
  categoryKeys?: string[];
  registrationDetails?: Record<string, unknown>;
  owner?: string;
  taxId?: string;
};

interface BusinessState {
  business: Business | null;
  updateBusiness: (data: BusinessPatch) => Promise<void>;
  deductBalance: (amount: number) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  /** Load merchant from API using `business_token` only (no cached business object). */
  bootstrapBusinessSession: () => Promise<boolean>;
  hydrate: () => Promise<void>;
}

export const useBusinessStore = create<BusinessState>()((set, get) => ({
  business: null,
  updateBusiness: async (data) => {
    const current = get().business;
    if (!current) return;
    await apiPatch<Business>(`/business/${current.id}`, data, 'BUSINESS');
    const fresh = await apiGet<Business>(`/business/${current.id}`, 'BUSINESS');
    if (fresh) {
      set({
        business: {
          ...fresh,
          logo: fresh.logo || (typeof data.logo === 'string' ? data.logo : current.logo),
          banner: fresh.banner || (typeof data.banner === 'string' ? data.banner : current.banner),
          images: fresh.images ?? (Array.isArray(data.images) ? (data.images as string[]) : current.images),
        },
      });
    }
  },
  deductBalance: async (amount) => {
    const current = get().business;
    if (!current) return;
    const updated = await apiPatch<Business>(
      `/business/${current.id}`,
      { balance: Math.max(0, current.balance - amount) },
      'BUSINESS',
    );
    set({ business: updated });
  },
  login: async (email, password) => {
    const policy = await fetchSecurityPolicy();
    if (passwordTooShort(password, policy.minPasswordLength)) {
      throw new Error(passwordLengthMessage(policy.minPasswordLength));
    }
    const auth = await apiPostOptional<{
      token: string;
      user: { email: string; role: string };
      sessionExpiresAt?: string;
    }>('/auth/login', { email, password });
    if (!auth || auth.user.role !== 'BUSINESS') return false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('business_token', auth.token);
      storeSessionExpiry('BUSINESS', auth.sessionExpiresAt);
    }
    try {
      const session = await apiGet<Business | null>('/auth/business-session', 'BUSINESS');
      if (!session) {
        get().logout();
        return false;
      }
      set({ business: session });
      return true;
    } catch {
      get().logout();
      return false;
    }
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('business_token');
      clearSessionExpiry('BUSINESS');
    }
    set({ business: null });
  },
  bootstrapBusinessSession: async () => {
    if (typeof window === 'undefined') {
      set({ business: null });
      return false;
    }
    if (isSessionExpired('BUSINESS')) {
      get().logout();
      return false;
    }
    if (!localStorage.getItem('business_token')) {
      set({ business: null });
      return false;
    }
    try {
      const session = await apiGet<Business | null>('/auth/business-session', 'BUSINESS');
      if (!session) {
        get().logout();
        return false;
      }
      set({ business: session });
      return true;
    } catch {
      get().logout();
      return false;
    }
  },
  hydrate: async () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('business_token')) {
      get().logout();
      return;
    }
    const current = get().business;
    const bid = current?.id;
    if (!bid) {
      await get().bootstrapBusinessSession();
      return;
    }
    try {
      const fresh = await apiGet<Business>(`/business/${bid}`, 'BUSINESS');
      if (fresh) set({ business: fresh });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('Invalid or missing session') || msg.includes('Not allowed')) {
        get().logout();
      }
    }
  },
}));
