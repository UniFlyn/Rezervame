import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BankAccountChangeRequest {
  id: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  bankName: string;
  accountHolder: string;
  accountLast4: string;
  routingOrIban: string;
  notes?: string;
}

interface State {
  requests: BankAccountChangeRequest[];
  submitRequest: (r: Omit<BankAccountChangeRequest, 'id' | 'submittedAt' | 'status'>) => void;
}

export const useBankChangeRequestsStore = create<State>()(
  persist(
    (set) => ({
      requests: [],
      submitRequest: (payload) =>
        set((state) => ({
          requests: [
            {
              ...payload,
              id: `bcr-${Date.now()}`,
              submittedAt: new Date().toISOString(),
              status: 'Pending',
            },
            ...state.requests,
          ],
        })),
    }),
    { name: 'bank-change-requests' },
  ),
);
