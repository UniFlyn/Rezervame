import { create } from 'zustand';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useBusinessStore } from './businessStore';

export interface Booking {
  id: string;
  userId: string;
  customerName: string;
  serviceId: string | null;
  staffId: string | null;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  price: number;
  walkIn?: boolean;
  recurring?: boolean;
  locked?: boolean;
}

export type BookingCreatePayload = {
  customerName: string;
  date: string;
  status: Booking['status'];
  price: number;
  serviceId?: string;
  staffId?: string;
};

interface BookingsState {
  bookings: Booking[];
  updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
  addBooking: (booking: BookingCreatePayload) => Promise<Booking>;
  hydrate: () => Promise<void>;
}

export const useBookingsStore = create<BookingsState>()((set) => ({
  bookings: [],
  updateBookingStatus: async (id, status) => {
    const updated = await apiPatch<Booking>(`/bookings/${id}`, { status }, 'BUSINESS');
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? { ...b, status: updated.status } : b)),
    }));
  },
  addBooking: async (booking) => {
    const business = useBusinessStore.getState().business;
    if (!business) throw new Error('No business session');
    const created = await apiPost<Booking>(
      `/business/${business.id}/bookings`,
      {
        customerName: booking.customerName,
        date: booking.date,
        status: booking.status,
        price: booking.price,
        serviceId: booking.serviceId || undefined,
        staffId: booking.staffId || undefined,
      },
      'BUSINESS',
    );
    const normalized: Booking = {
      ...created,
      date: typeof created.date === 'string' ? created.date : new Date(created.date as unknown as Date).toISOString(),
    };
    set((state) => ({ bookings: [normalized, ...state.bookings] }));
    return normalized;
  },
  hydrate: async () => {
    const business = useBusinessStore.getState().business;
    if (!business) return;
    // We fetch a larger limit for the calendar/store hydrate to ensure a good initial view,
    // though the list view will use its own paginated fetch.
    const response = await apiGet<{ data: Booking[] }>(`/business/${business.id}/bookings?limit=100`, 'BUSINESS');
    const raw = Array.isArray(response) ? response : response.data || [];
    const bookings = raw.map((b) => ({
      ...b,
      date: typeof b.date === 'string' ? b.date : new Date(b.date as unknown as Date).toISOString(),
    }));
    set({ bookings });
  },
}));
