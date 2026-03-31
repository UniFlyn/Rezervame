import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import bookingsData from '../mock-data/bookings.json';

export interface Booking {
  id: string;
  userId: string;
  customerName: string;
  serviceId: string;
  staffId: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  price: number;
}

interface BookingsState {
  bookings: Booking[];
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  addBooking: (booking: Booking) => void;
}

export const useBookingsStore = create<BookingsState>()(
  persist(
    (set) => ({
      bookings: bookingsData as Booking[],
      updateBookingStatus: (id, status) =>
        set((state) => ({
          bookings: state.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
        })),
      addBooking: (booking) => set((state) => ({ bookings: [booking, ...state.bookings] })),
    }),
    { name: 'bookings-storage' }
  )
);
