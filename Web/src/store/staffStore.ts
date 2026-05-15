import { create } from 'zustand';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { useBusinessStore } from './businessStore';

export interface Staff {
  id: string;
  name: string;
  role: string;
  skills: string[];
  /** Empty or omitted = not restricted (booking UI treats as all services). */
  serviceIds?: string[];
  availability: string;
  image?: string | null;
}

export type StaffCreatePayload = Pick<Staff, 'name' | 'role' | 'skills' | 'availability'> & {
  image?: string | null;
  serviceIds?: string[];
};

interface StaffState {
  staff: Staff[];
  total: number;
  totalPages: number;
  addStaff: (member: StaffCreatePayload) => Promise<Staff>;
  updateStaff: (id: string, data: Partial<StaffCreatePayload>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  hydrate: (page?: number, limit?: number, search?: string, role?: string) => Promise<void>;
}

export const useStaffStore = create<StaffState>()((set) => ({
  staff: [],
  total: 0,
  totalPages: 1,
  addStaff: async (member) => {
    const business = useBusinessStore.getState().business;
    if (!business) throw new Error('No business session');
    const created = await apiPost<Staff>(`/business/${business.id}/staff`, member, 'BUSINESS');
    set((state) => ({ staff: [...state.staff, created], total: state.total + 1 }));
    return created;
  },
  updateStaff: async (id, data) => {
    const updated = await apiPatch<Staff>(`/staff/${id}`, data, 'BUSINESS');
    set((state) => ({
      staff: state.staff.map((s) => (s.id === id ? updated : s)),
    }));
  },
  deleteStaff: async (id) => {
    await apiDelete(`/staff/${id}`, 'BUSINESS');
    set((state) => ({ 
      staff: state.staff.filter((s) => s.id !== id),
      total: Math.max(0, state.total - 1)
    }));
  },
  hydrate: async (page = 1, limit = 20, search = '', role = '') => {
    const business = useBusinessStore.getState().business;
    if (!business) return;
    let url = `/business/${business.id}/staff?page=${page}&limit=${limit}`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    if (role.trim()) url += `&role=${encodeURIComponent(role.trim())}`;

    const response = await apiGet<{ data: Staff[]; total: number; totalPages: number }>(
      url, 
      'BUSINESS'
    );
    set({ 
      staff: response.data || [], 
      total: response.total || 0, 
      totalPages: response.totalPages || 1 
    });
  },
}));
