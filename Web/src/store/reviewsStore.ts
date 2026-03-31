import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import reviewsData from '../mock-data/reviews.json';

export interface Review {
  id: string;
  customerName: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  serviceName: string;
  staffName: string;
  reply?: string;
  status: 'Pending' | 'Replied';
}

interface ReviewsState {
  reviews: Review[];
  addReply: (id: string, reply: string) => void;
  deleteReview: (id: string) => void;
}

export const useReviewsStore = create<ReviewsState>()(
  persist(
    (set) => ({
      reviews: reviewsData as Review[],
      addReply: (id, reply) =>
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === id ? { ...r, reply, status: 'Replied' } : r
          ),
        })),
      deleteReview: (id) =>
        set((state) => ({
          reviews: state.reviews.filter((r) => r.id !== id),
        })),
    }),
    { name: 'reviews-storage' }
  )
);
