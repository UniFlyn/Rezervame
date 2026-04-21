import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import businessData from '../mock-data/business.json';

export interface Business {
  id: string;
  name: string;
  logo: string;
  banner: string;
  description: string;
  category: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  /** Full profile URLs (https://…) */
  socialYoutube?: string;
  socialInstagram?: string;
  socialX?: string;
  socialTiktok?: string;
  balance: number;
}

interface BusinessState {
  business: Business | null;
  updateBusiness: (data: Partial<Business>) => void;
  deductBalance: (amount: number) => void;
  login: () => void;
  logout: () => void;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      business: businessData[0],
      updateBusiness: (data) =>
        set((state) => ({
          business: state.business ? { ...state.business, ...data } : null,
        })),
      deductBalance: (amount) =>
        set((state) => {
          if (!state.business) return state;
          return {
            business: { ...state.business, balance: state.business.balance - amount },
          };
        }),
      login: () => set({ business: businessData[0] }),
      logout: () => set({ business: null }),
    }),
    { name: 'business-storage' }
  )
);
