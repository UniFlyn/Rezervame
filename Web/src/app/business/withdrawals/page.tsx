'use client';
import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { useBusinessStore } from '../../../store/businessStore';
import { Wallet, ArrowRight, Building2, Loader2 } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { toastError, toastSuccess } from '@/lib/toast';
import { Pagination } from '@/components/ui/pagination';

type WithdrawalRow = {
  id: string;
  amount: number;
  balance: number;
  status: string;
  date: string;
};

export default function WithdrawalsPage() {
  const business = useBusinessStore((state) => state.business);
  const hydrateBusiness = useBusinessStore((state) => state.hydrate);

  const [amount, setAmount] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountHolder: '',
    accountLast4: '',
    routingOrIban: '',
    notes: '',
  });
  const [bankSubmitOk, setBankSubmitOk] = useState(false);

  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const loadWithdrawals = useCallback(async () => {
    if (!business?.id) {
      setWithdrawals([]);
      setWithdrawalsLoading(false);
      return;
    }
    setWithdrawalsLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      const response = await apiGet<{ data: WithdrawalRow[]; total: number; totalPages: number }>(
        `/business/${business.id}/withdrawals?${query.toString()}`,
        'BUSINESS'
      );
      setWithdrawals(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch {
      setWithdrawals([]);
      toastError('Could not load withdrawals', 'Try refreshing the page.');
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [business?.id, page]);

  useEffect(() => {
    void loadWithdrawals();
    void hydrateBusiness();
  }, [loadWithdrawals, hydrateBusiness]);

  const handleWithdraw = async () => {
    const val = parseFloat(amount);
    if (Number.isNaN(val) || val <= 0) {
      setError('Enter a valid positive amount.');
      return;
    }
    if (!business?.id) return;
    if (val > (business.balance || 0)) {
      setError('Insufficient balance.');
      return;
    }

    setError('');
    try {
      await apiPost<WithdrawalRow>(`/business/${business.id}/withdrawals`, { amount: val }, 'BUSINESS');
      await hydrateBusiness();
      setPage(1);
      void loadWithdrawals();
      setSuccess(true);
      setAmount('');
      toastSuccess('Withdrawal requested', 'Your request is pending processing.');
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed.';
      setError(msg);
      toastError('Withdrawal failed', msg);
    }
  };

  const handleBankChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    if (!bankForm.bankName.trim() || !bankForm.accountHolder.trim() || !bankForm.accountLast4.trim()) {
      return;
    }
    const message = [
      'Bank change request',
      `Bank: ${bankForm.bankName.trim()}`,
      `Account holder: ${bankForm.accountHolder.trim()}`,
      `Last 4: ${bankForm.accountLast4.trim()}`,
      bankForm.routingOrIban.trim() ? `Routing/IBAN: ${bankForm.routingOrIban.trim()}` : '',
      bankForm.notes.trim() ? `Notes: ${bankForm.notes.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await apiPost(`/business/${business.id}/support-request`, { message }, 'BUSINESS');
      setBankSubmitOk(true);
      setBankForm({ bankName: '', accountHolder: '', accountLast4: '', routingOrIban: '', notes: '' });
      toastSuccess('Request sent', 'Our team will review your bank details.');
      setTimeout(() => setBankSubmitOk(false), 4000);
    } catch (err) {
      toastError(
        'Could not send request',
        err instanceof Error ? err.message : 'Try again later.',
      );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Withdrawals</h2>
          <p className="text-sm font-bold text-[var(--rz-gray-500)] uppercase tracking-widest mt-1">Manage your business earnings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-[var(--rz-navy)] to-[var(--rz-navy-800)] rounded-[32px] p-10 text-white shadow-2xl shadow-[color:rgba(231,234,239,0.5)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-white/40 font-black uppercase tracking-[0.2em] text-[9px] mb-4">Available Balance</p>
                <h3 className="text-5xl font-black tracking-tighter text-emerald-400">${business?.balance?.toFixed(2) ?? '0.00'}</h3>
                <p className="mt-2 text-xs font-semibold text-[var(--rz-gray-500)]">
                  Available after customer payments (platform commission deducted). Total revenue: ${business?.revenue?.toFixed(2) ?? '0.00'}
                </p>
              </div>
              <div className="border-l border-white/10 pl-8">
                <p className="text-white/40 font-black uppercase tracking-[0.2em] text-[9px] mb-4">Lifetime Revenue</p>
                <h3 className="text-5xl font-black tracking-tighter text-white/90">${business?.revenue?.toFixed(2) ?? '0.00'}</h3>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Account status</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="font-bold text-sm text-white/90 capitalize">{business?.status || 'Active'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Business ID</p>
                <p className="font-mono text-[10px] text-white/40 uppercase">{(business?.id || '—').slice(0, 12)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-10 shadow-xl shadow-[color:rgba(231,234,239,0.5)] border border-[var(--rz-gray-100)] flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>

          <h3 className="text-lg font-black text-[var(--rz-navy-800)] mb-6 uppercase tracking-tight flex items-center">
            Withdraw Funds
          </h3>

          {success && (
            <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-2xl text-xs font-bold border border-green-100 animate-in fade-in zoom-in">
              Withdrawal submitted.
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-bold border border-red-100">{error}</div>
          )}

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1 mb-2 block">
                Amount to Transfer
              </label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--rz-gray-500)] font-bold">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-12 pr-6 py-5 bg-[var(--rz-gray-050)] border-2 border-[var(--rz-gray-100)] rounded-2xl focus:outline-none focus:border-primary focus:bg-white text-xl font-bold transition-all placeholder:text-[var(--rz-gray-200)]"
                  placeholder="0.00"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleWithdraw()}
              className="w-full py-5 bg-[var(--rz-navy)] hover:bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-[color:var(--rz-gray-200)] flex items-center justify-center space-x-3 group"
            >
              <span>Request withdrawal</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <form
          onSubmit={(e) => void handleBankChangeRequest(e)}
          className="rounded-[32px] border border-[var(--rz-gray-100)] bg-white p-10 shadow-xl shadow-[color:rgba(231,234,239,0.5)]"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-[var(--rz-navy)]">Bank Account Change</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
                Request reviewed by the Rezervame team
              </p>
            </div>
          </div>
          {bankSubmitOk && (
            <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
              Request sent. We will notify you once it is evaluated.
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">Bank</label>
              <input
                required
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                className="w-full rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] px-6 py-4 font-bold transition-all focus:border-primary focus:bg-white focus:outline-none"
                placeholder="Bank Name"
              />
            </div>
            <div>
              <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">
                Account Holder
              </label>
              <input
                required
                value={bankForm.accountHolder}
                onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                className="w-full rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] px-6 py-4 font-bold transition-all focus:border-primary focus:bg-white focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">
                  Last 4 Digits
                </label>
                <input
                  required
                  maxLength={4}
                  value={bankForm.accountLast4}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, accountLast4: e.target.value.replace(/\D/g, '').slice(0, 4) })
                  }
                  className="w-full rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] px-6 py-4 font-bold transition-all focus:border-primary focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">
                  Routing / IBAN (optional)
                </label>
                <input
                  value={bankForm.routingOrIban}
                  onChange={(e) => setBankForm({ ...bankForm, routingOrIban: e.target.value })}
                  className="w-full rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] px-6 py-4 font-bold transition-all focus:border-primary focus:bg-white focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">Notes</label>
              <textarea
                value={bankForm.notes}
                onChange={(e) => setBankForm({ ...bankForm, notes: e.target.value })}
                rows={3}
                className="w-full rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] px-6 py-4 font-bold transition-all focus:border-primary focus:bg-white focus:outline-none"
                placeholder="Reason for change..."
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-2xl bg-[var(--rz-navy)] py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-primary"
            >
              Send Request
            </button>
          </div>
        </form>

        <div className="rounded-[32px] border border-[var(--rz-gray-100)] bg-white p-10 shadow-xl shadow-[color:rgba(231,234,239,0.5)] flex flex-col justify-center">
          <h3 className="mb-2 text-lg font-black uppercase tracking-tight text-[var(--rz-navy)]">Requests</h3>
          <p className="text-sm font-semibold text-[var(--rz-gray-500)] leading-relaxed">
            Bank account change history appears once the team processes your message. Use the form to
            send updated details.
          </p>
        </div>
      </div>

      <div className="mt-12 overflow-hidden rounded-[40px] border border-[var(--rz-gray-100)] bg-white shadow-2xl shadow-[color:rgba(231,234,239,0.5)] relative min-h-[400px]">
        {withdrawalsLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--rz-gray-500)]" />
          </div>
        )}
        <div className="px-10 py-8 border-b border-[var(--rz-gray-050)] flex justify-between items-center bg-white">
          <div>
            <h3 className="font-black text-[var(--rz-navy-800)] uppercase tracking-tight text-xl">Withdrawal History</h3>
            <p className="text-[10px] font-bold text-[var(--rz-gray-500)] uppercase tracking-[0.2em] mt-1">From your business account</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-[var(--rz-gray-050)] px-4 py-2 rounded-xl text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest border border-[var(--rz-gray-100)]">
              {totalItems} RECORDS
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-[0.2em]">
                <th className="px-10 py-6">Withdrawal ID</th>
                <th className="px-10 py-6">Date</th>
                <th className="px-10 py-6">Amount</th>
                <th className="px-10 py-6">Balance after</th>
                <th className="px-10 py-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rz-gray-050)] text-sm font-bold text-[var(--rz-gray-600)]">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-[#f7f8fa]/50 transition-colors group">
                  <td className="px-10 py-6 font-mono text-[11px] text-[var(--rz-gray-300)] group-hover:text-[var(--rz-navy)] transition-colors">
                    {w.id.slice(0, 12).toUpperCase()}
                  </td>
                  <td className="px-10 py-6 text-[var(--rz-gray-500)] font-bold whitespace-nowrap">
                    {new Date(w.date).toLocaleString()}
                  </td>
                  <td className="px-10 py-6 font-black text-[var(--rz-navy)] text-lg">${Number(w.amount).toFixed(2)}</td>
                  <td className="px-10 py-6 text-[var(--rz-gray-500)] font-medium">${Number(w.balance).toFixed(2)}</td>
                  <td className="px-10 py-6">
                    <span className={clsx(
                      "inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border",
                      w.status.toLowerCase() === 'pending' && "bg-amber-50 text-amber-600 border-amber-100",
                      w.status.toLowerCase() === 'completed' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                      w.status.toLowerCase() === 'rejected' && "bg-rose-50 text-rose-600 border-rose-100",
                      !['pending', 'completed', 'rejected'].includes(w.status.toLowerCase()) && "bg-[var(--rz-gray-050)] text-[var(--rz-gray-500)] border-[var(--rz-gray-100)]"
                    )}>
                      {w.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!withdrawalsLoading && withdrawals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-[var(--rz-gray-050)] rounded-full flex items-center justify-center mb-4 border border-[var(--rz-gray-100)]">
                        <Wallet className="w-6 h-6 text-[var(--rz-gray-300)]" />
                      </div>
                      <p className="text-[var(--rz-gray-500)] font-black uppercase tracking-widest text-[10px]">
                        No withdrawals yet
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
