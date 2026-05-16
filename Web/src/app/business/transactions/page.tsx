"use client";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTransactionsStore, Transaction } from '../../../store/transactionsStore';
import { ArrowUpRight, ArrowDownLeft, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { BusinessFilterToolbar } from '../../../components/business/BusinessFilterToolbar';
import { useBusinessStore } from '../../../store/businessStore';
import { apiGet } from '@/lib/api';
import { Pagination } from '@/components/ui/pagination';

export default function TransactionsPage() {
  const transactions = useTransactionsStore((state) => state.transactions);
  const hydrateTransactions = useTransactionsStore((state) => state.hydrate);
  const business = useBusinessStore((state) => state.business);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Earning' | 'Withdrawal'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detail, setDetail] = useState<Transaction | null>(null);

  const [paginatedTransactions, setPaginatedTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 10;

  const fetchTransactions = useCallback(async () => {
    if (!business) return;
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: search,
        type: typeFilter,
        status: statusFilter,
      });
      const response = await apiGet<{ data: Transaction[]; total: number; totalPages: number }>(
        `/business/${business.id}/transactions?${query.toString()}`,
        'BUSINESS'
      );
      setPaginatedTransactions(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setIsLoading(false);
    }
  }, [business, page, search, typeFilter, statusFilter]);

  useEffect(() => {
    void hydrateTransactions();
  }, [hydrateTransactions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter]);

  const statuses = useMemo(() => ['all', ...Array.from(new Set(transactions.map((t) => t.status)))], [transactions]);

  return (
    <div className="space-y-6 pb-10">
      <div><h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Transactions</h2><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Payments, earnings and withdrawals</p></div>
      <BusinessFilterToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by tx id, booking id, email, staff...">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2"><select className="cursor-pointer bg-transparent text-[10px] font-black uppercase tracking-widest outline-none" value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value as 'all'|'Earning'|'Withdrawal')}><option value="all">All types</option><option value="Earning">Earning</option><option value="Withdrawal">Withdrawal</option></select></div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2"><select className="cursor-pointer bg-transparent text-[10px] font-black uppercase tracking-widest outline-none" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>{statuses.map((s)=><option key={s} value={s}>{s==='all'?'All statuses':s}</option>)}</select></div>
      </BusinessFilterToolbar>
      <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-xl shadow-slate-200/50 relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead><tr className="border-b border-slate-50 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400"><th className="px-6 py-4">Transaction ID</th><th className="px-6 py-4">Booking ID</th><th className="px-6 py-4">Customer email</th><th className="px-6 py-4">Staff</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Amount</th><th className="px-6 py-4 text-right"> </th></tr></thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {paginatedTransactions.map((tx)=><tr key={tx.id} className="font-bold text-slate-600 transition-colors hover:bg-slate-50/80"><td className="px-6 py-4 font-mono text-xs text-slate-500">{tx.id}</td><td className="px-6 py-4 font-mono text-xs">{tx.bookingId || (tx.type === 'Withdrawal' ? tx.description : '—')}</td><td className="max-w-[180px] truncate px-6 py-4 text-xs">{tx.customerEmail||'—'}</td><td className="px-6 py-4 text-xs">{tx.staffMember||'—'}</td><td className="whitespace-nowrap px-6 py-4 text-xs">{new Date(tx.date).toLocaleString()}</td><td className="px-6 py-4"><div className={clsx('inline-flex items-center gap-1',tx.type==='Earning'?'text-emerald-600':'text-orange-600')}>{tx.type==='Earning'?<ArrowUpRight className="h-4 w-4" />:<ArrowDownLeft className="h-4 w-4" />}<span>{tx.type||'—'}</span></div></td><td className="px-6 py-4"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">{tx.status}</span></td><td className={clsx('px-6 py-4 text-right font-black',tx.type==='Earning'?'text-emerald-600':'text-slate-900')}>{tx.type==='Earning'?'+':'-'}${tx.amount.toFixed(2)}</td><td className="px-6 py-4 text-right"><button type="button" onClick={()=>setDetail(tx)} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Details</button></td></tr>)}
              {!isLoading && paginatedTransactions.length===0 && <tr><td colSpan={9} className="px-6 py-16 text-center text-slate-400">No transactions match these filters.</td></tr>}
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
      {detail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[32px] border border-slate-100 bg-white p-8 shadow-2xl"><div className="mb-6 flex items-start justify-between"><div><h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Details</h3><p className="mt-1 font-mono text-xs text-slate-400">{detail.id}</p></div><button type="button" onClick={()=>setDetail(null)} className="rounded-2xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900"><X size={20} /></button></div><dl className="space-y-4 text-sm"><div className="flex justify-between gap-4 border-b border-slate-50 pb-3"><dt className="font-black uppercase tracking-widest text-slate-400">Booking ID</dt><dd className="font-mono font-bold">{detail.bookingId||'—'}</dd></div><div className="flex justify-between gap-4 border-b border-slate-50 pb-3"><dt className="font-black uppercase tracking-widest text-slate-400">Customer (email)</dt><dd className="text-right font-bold">{detail.customerEmail||'—'}</dd></div><div className="flex justify-between gap-4 border-b border-slate-50 pb-3"><dt className="font-black uppercase tracking-widest text-slate-400">Staff</dt><dd className="text-right font-bold">{detail.staffMember||'—'}</dd></div><div className="flex justify-between gap-4 border-b border-slate-50 pb-3"><dt className="font-black uppercase tracking-widest text-slate-400">Date</dt><dd className="font-bold">{new Date(detail.date).toLocaleString()}</dd></div><div className="flex justify-between gap-4 border-b border-slate-50 pb-3"><dt className="font-black uppercase tracking-widest text-slate-400">Type</dt><dd className="font-bold">{detail.type}</dd></div><div className="flex justify-between gap-4 border-b border-slate-50 pb-3"><dt className="font-black uppercase tracking-widest text-slate-400">Status</dt><dd className="font-bold">{detail.status}</dd></div><div className="flex justify-between gap-4 pt-2"><dt className="font-black uppercase tracking-widest text-slate-400">Amount</dt><dd className="text-lg font-black text-primary">${detail.amount.toFixed(2)}</dd></div></dl><button type="button" onClick={()=>setDetail(null)} className="mt-8 w-full rounded-2xl bg-slate-900 py-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary">Close</button></div></div>}
    </div>
  );
}
