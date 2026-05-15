import { create } from 'zustand';
import { apiGet, apiPost } from '@/lib/api';
import { useBusinessStore } from './businessStore';

export interface Transaction {
  id: string;
  bookingId?: string;
  /** Shown for earnings; ties payout to a booking / service. */
  customerEmail?: string;
  staffMember?: string;
  amount: number;
  status: string;
  date: string;
  type?: 'Earning' | 'Withdrawal';
}

interface TransactionsState {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useTransactionsStore = create<TransactionsState>()((set) => ({
  transactions: [],
  addTransaction: async (tx) => {
    const business = useBusinessStore.getState().business;
    if (!business) return;
    const created = await apiPost<Transaction>(`/business/${business.id}/transactions`, tx, 'BUSINESS');
    set((state) => ({ transactions: [created, ...state.transactions] }));
  },
  hydrate: async () => {
    const business = useBusinessStore.getState().business;
    if (!business) return;
    const transactions = await apiGet<Transaction[]>(`/business/${business.id}/transactions`, 'BUSINESS');
    set({ transactions });
  },
}));
