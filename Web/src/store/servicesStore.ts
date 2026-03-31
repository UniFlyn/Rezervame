import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import servicesData from '../mock-data/services.json';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
  staff: string[];
}

interface ServicesState {
  services: Service[];
  addService: (service: Service) => void;
  updateService: (id: string, data: Partial<Service>) => void;
  deleteService: (id: string) => void;
}

export const useServicesStore = create<ServicesState>()(
  persist(
    (set) => ({
      services: servicesData,
      addService: (service) => set((state) => ({ services: [...state.services, service] })),
      updateService: (id, data) =>
        set((state) => ({
          services: state.services.map((s) => (s.id === id ? { ...s, ...data } : s)),
        })),
      deleteService: (id) =>
        set((state) => ({ services: state.services.filter((s) => s.id !== id) })),
    }),
    { name: 'services-storage' }
  )
);
