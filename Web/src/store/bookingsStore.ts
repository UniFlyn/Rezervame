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
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Paid' | 'Rescheduled' | 'Cancelled';
  price: number;
  walkIn?: boolean;
  recurring?: boolean;
  locked?: boolean;
  transactionId?: string;
  paymentMethod?: string | null;
  taxAmount?: number | null;
  bookingGroupId?: string | null;
  /** From API include — avoids relying on paginated services store */
  serviceName?: string | null;
  staffName?: string | null;
  serviceDurationMinutes?: number | null;
  accountHolderName?: string | null;
  memberEmail?: string | null;
  familyMemberName?: string | null;
}

export function normalizeBookingRow(raw: Record<string, unknown>): Booking {
  const service = raw.service as { id?: string; name?: string; duration?: number } | null | undefined;
  const staff = raw.staff as { id?: string; name?: string } | null | undefined;
  const user = raw.user as { name?: string; email?: string } | null | undefined;
  const familyMember = raw.familyMember as { name?: string } | null | undefined;
  const dateRaw = raw.date;
  return {
    id: String(raw.id),
    userId: String(raw.userId ?? ''),
    customerName: String(raw.customerName ?? ''),
    serviceId: (raw.serviceId as string | null) ?? service?.id ?? null,
    staffId: (raw.staffId as string | null) ?? staff?.id ?? null,
    date:
      typeof dateRaw === 'string'
        ? dateRaw
        : dateRaw instanceof Date
          ? dateRaw.toISOString()
          : new Date(String(dateRaw)).toISOString(),
    status: raw.status as Booking['status'],
    price: Number(raw.price) || 0,
    walkIn: Boolean(raw.walkIn),
    recurring: Boolean(raw.recurring),
    locked: Boolean(raw.locked),
    transactionId: (raw.transactionId as string | undefined) ?? undefined,
    paymentMethod:
      (raw.paymentMethod as string | undefined) ??
      (raw.transaction as { paymentMethod?: string } | null | undefined)?.paymentMethod ??
      null,
    taxAmount: raw.taxAmount != null ? Number(raw.taxAmount) : null,
    bookingGroupId:
      typeof raw.bookingGroupId === 'string' ? raw.bookingGroupId : null,
    serviceName: service?.name ?? null,
    staffName: staff?.name ?? null,
    serviceDurationMinutes: service?.duration ?? null,
    accountHolderName: user?.name ?? null,
    memberEmail: user?.email ?? null,
    familyMemberName: familyMember?.name ?? null,
  };
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
  updateBookingStatus: (id: string, status: string) => Promise<void>;
  bulkUpdateBookingStatus: (ids: string[], status: string) => Promise<void>;
  payBookingGroup: (ids: string[], method: string) => Promise<void>;
  addBooking: (booking: BookingCreatePayload) => Promise<Booking>;
  hydrate: () => Promise<void>;
}

export const useBookingsStore = create<BookingsState>()((set) => ({
  bookings: [],
  updateBookingStatus: async (id, status) => {
    const updated = await apiPatch<Booking>(`/bookings/${id}`, { status }, 'BUSINESS');
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? { ...b, status: updated.status as any } : b)),
    }));
  },
  bulkUpdateBookingStatus: async (ids, status) => {
    const business = useBusinessStore.getState().business;
    if (!business) return;
    await apiPatch(`/business/${business.id}/panel/bookings/bulk-status`, { bookingIds: ids, status }, 'BUSINESS');
    set((state) => ({
      bookings: state.bookings.map((b) => (ids.includes(b.id) ? { ...b, status: status as any } : b)),
    }));
  },
  payBookingGroup: async (ids, method) => {
    const business = useBusinessStore.getState().business;
    if (!business) return;
    await apiPost(`/business/${business.id}/pay-group`, { bookingIds: ids, paymentMethod: method }, 'BUSINESS');
    await useBusinessStore.getState().hydrate();
    set((state) => ({
      bookings: state.bookings.map((b) => (ids.includes(b.id) ? { ...b, status: 'Paid' } : b)),
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
    const bookings = raw.map((b) => normalizeBookingRow(b as Record<string, unknown>));
    set({ bookings });
  },
}));
