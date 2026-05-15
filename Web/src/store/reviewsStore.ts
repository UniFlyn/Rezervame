import { create } from 'zustand';
import { apiDelete, apiGet, apiPatch } from '@/lib/api';
import { useBusinessStore } from './businessStore';

export interface Review {
  id: string;
  customerName: string;
  avatar: string;
  rating: number;
  staffRating?: number;
  businessRating?: number;
  comment: string;
  date: string;
  serviceName: string;
  staffName: string;
  reply?: string;
  status: 'Pending' | 'Replied';
}

interface ReviewsState {
  reviews: Review[];
  addReply: (id: string, reply: string) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useReviewsStore = create<ReviewsState>()((set) => ({
  reviews: [],
  addReply: async (id, reply) => {
    const updated = await apiPatch<Review>(`/reviews/${id}`, { reply, status: 'Replied' }, 'BUSINESS');
    set((state) => ({
      reviews: state.reviews.map((r) => (r.id === id ? updated : r)),
    }));
  },
  deleteReview: async (id) => {
    await apiDelete(`/reviews/${id}`, 'BUSINESS');
    set((state) => ({
      reviews: state.reviews.filter((r) => r.id !== id),
    }));
  },
  hydrate: async () => {
    const business = useBusinessStore.getState().business;
    if (!business) return;
    const reviews = await apiGet<Review[]>(`/business/${business.id}/reviews`, 'BUSINESS');
    set({ reviews });
  },
}));
