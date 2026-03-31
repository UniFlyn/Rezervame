import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import employeesData from '../mock-data/employees.json';

export interface Staff {
  id: string;
  name: string;
  role: string;
  skills: string[];
  availability: string;
  image?: string;
}

interface StaffState {
  staff: Staff[];
  addStaff: (member: Staff) => void;
  updateStaff: (id: string, data: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
}

export const useStaffStore = create<StaffState>()(
  persist(
    (set) => ({
      staff: employeesData,
      addStaff: (member) =>
        set((state) => ({ staff: [...state.staff, member] })),
      updateStaff: (id, data) =>
        set((state) => ({
          staff: state.staff.map((s) => (s.id === id ? { ...s, ...data } : s)),
        })),
      deleteStaff: (id) =>
        set((state) => ({ staff: state.staff.filter((s) => s.id !== id) })),
    }),
    { name: 'staff-storage' }
  )
);
