import { create } from 'zustand';
import { apiGet, apiPatch, apiPostOptional } from '@/lib/api';

export interface Business {
  id: string;
  name: string;
  logo: string;
  banner: string;
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
  balance: number;
  revenue: number;
  notifyBookingEmail?: boolean;
  notifyCancellationEmail?: boolean;
  notifyDailySummary?: boolean;
  /** Business onboarding / moderation status from API (`Business.status`). */
  status?: string;
  taxPercentage?: number;
}

interface BusinessState {
  business: Business | null;
  updateBusiness: (data: Partial<Business>) => Promise<void>;
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
    const updated = await apiPatch<Business>(`/business/${current.id}`, data, 'BUSINESS');
    set({ business: updated });
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
    const auth = await apiPostOptional<{ token: string; user: { email: string; role: string } }>(
      '/auth/login',
      { email, password },
    );
    if (!auth || auth.user.role !== 'BUSINESS') return false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('business_token', auth.token);
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
    }
    set({ business: null });
  },
  bootstrapBusinessSession: async () => {
    if (typeof window === 'undefined') {
      set({ business: null });
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
