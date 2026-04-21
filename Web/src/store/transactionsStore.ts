import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import transactionsData from '../mock-data/transactions.json';

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
  addTransaction: (tx: Transaction) => void;
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set) => ({
      transactions: transactionsData.map(t => ({ 
        ...t, 
        type: (t.type as 'Earning' | 'Withdrawal') || 'Earning' 
      })),
      addTransaction: (tx) =>
        set((state) => ({ transactions: [tx, ...state.transactions] })),
    }),
    { name: 'transactions-storage' }
  )
);
