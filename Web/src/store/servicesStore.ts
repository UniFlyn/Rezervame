import { create } from 'zustand';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { useBusinessStore } from './businessStore';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
  imageUrl?: string | null;
}

export type ServiceCreatePayload = Pick<Service, 'name' | 'price' | 'duration' | 'category'> & {
  imageUrl?: string | null;
};

interface ServicesState {
  services: Service[];
  total: number;
  totalPages: number;
  addService: (service: ServiceCreatePayload) => Promise<Service>;
  updateService: (id: string, data: Partial<ServiceCreatePayload>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  hydrate: (page?: number, limit?: number, search?: string, category?: string) => Promise<void>;
}

export const useServicesStore = create<ServicesState>()((set) => ({
  services: [],
  total: 0,
  totalPages: 1,
  addService: async (service) => {
    const business = useBusinessStore.getState().business;
    if (!business) throw new Error('No business session');
    const created = await apiPost<Service>(
      `/business/${business.id}/services`,
      {
        name: service.name,
        price: service.price,
        duration: service.duration,
        category: service.category,
        ...(service.imageUrl != null && service.imageUrl !== ''
          ? { imageUrl: service.imageUrl }
          : {}),
      },
      'BUSINESS',
    );
    set((state) => ({ services: [...state.services, created], total: state.total + 1 }));
    return created;
  },
  updateService: async (id, data) => {
    const updated = await apiPatch<Service>(`/services/${id}`, data, 'BUSINESS');
    set((state) => ({
      services: state.services.map((s) => (s.id === id ? updated : s)),
    }));
  },
  deleteService: async (id) => {
    await apiDelete(`/services/${id}`, 'BUSINESS');
    set((state) => ({ 
      services: state.services.filter((s) => s.id !== id),
      total: Math.max(0, state.total - 1)
    }));
  },
  hydrate: async (page = 1, limit = 20, search = '', category = '') => {
    const business = useBusinessStore.getState().business;
    if (!business) return;
    let url = `/business/${business.id}/services?page=${page}&limit=${limit}`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    if (category.trim()) url += `&category=${encodeURIComponent(category.trim())}`;
    
    const response = await apiGet<{ data: Service[]; total: number; totalPages: number }>(
      url, 
      'BUSINESS'
    );
    set({ 
      services: response.data || [], 
      total: response.total || 0, 
      totalPages: response.totalPages || 1 
    });
  },
}));
