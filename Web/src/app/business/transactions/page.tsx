'use client';

import { useMemo, useState } from 'react';
import { useTransactionsStore, Transaction } from '../../../store/transactionsStore';
import { ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';
import clsx from 'clsx';
import { BusinessFilterToolbar } from '../../../components/business/BusinessFilterToolbar';

export default function TransactionsPage() {
  const transactions = useTransactionsStore((state) => state.transactions);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Earning' | 'Withdrawal'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detail, setDetail] = useState<Transaction | null>(null);

  const statuses = useMemo(() => {
    const s = new Set(transactions.map((t) => t.status));
    return ['all', ...Array.from(s)];
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      const matchStatus = statusFilter === 'all' || tx.status === statusFilter;
      const matchQ =
        !q ||
        tx.id.toLowerCase().includes(q) ||
        (tx.bookingId && tx.bookingId.toLowerCase().includes(q)) ||
        (tx.customerEmail && tx.customerEmail.toLowerCase().includes(q)) ||
        (tx.staffMember && tx.staffMember.toLowerCase().includes(q));
      return matchType && matchStatus && matchQ;
    });
  }, [transactions, search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Transacciones</h2>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Pagos, ingresos y retiros
        </p>
      </div>

      <BusinessFilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por ID, reserva, email, staff…"
      >
        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
          <select
            className="cursor-pointer bg-transparent text-[10px] font-black uppercase tracking-widest outline-none"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'Earning' | 'Withdrawal')}
          >
            <option value="all">Todos los tipos</option>
            <option value="Earning">Ingresos</option>
            <option value="Withdrawal">Retiros</option>
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
          <select
            className="cursor-pointer bg-transparent text-[10px] font-black uppercase tracking-widest outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'Todos los estados' : s}
              </option>
            ))}
          </select>
        </div>
      </BusinessFilterToolbar>

      <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">ID transacción</th>
                <th className="px-6 py-4">ID reserva</th>
                <th className="px-6 py-4">Email cliente</th>
                <th className="px-6 py-4">Staff</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Importe</th>
                <th className="px-6 py-4 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filtered.map((tx) => (
                <tr key={tx.id} className="font-bold text-slate-600 transition-colors hover:bg-slate-50/80">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{tx.id}</td>
                  <td className="px-6 py-4 font-mono text-xs">{tx.bookingId || '—'}</td>
                  <td className="max-w-[180px] truncate px-6 py-4 text-xs">{tx.customerEmail || '—'}</td>
                  <td className="px-6 py-4 text-xs">{tx.staffMember || '—'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-xs">
                    {new Date(tx.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={clsx(
                        'inline-flex items-center gap-1',
                        tx.type === 'Earning' ? 'text-emerald-600' : 'text-orange-600',
                      )}
                    >
                      {tx.type === 'Earning' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      <span>{tx.type || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">
                      {tx.status}
                    </span>
                  </td>
                  <td
                    className={clsx(
                      'px-6 py-4 text-right font-black',
                      tx.type === 'Earning' ? 'text-emerald-600' : 'text-slate-900',
                    )}
                  >
                    {tx.type === 'Earning' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setDetail(tx)}
                      className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                    >
                      Detalle
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-400">
                    No hay transacciones con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] border border-slate-100 bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Detalle</h3>
                <p className="mt-1 font-mono text-xs text-slate-400">{detail.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-2xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-50 pb-3">
                <dt className="font-black uppercase tracking-widest text-slate-400">ID reserva</dt>
                <dd className="font-mono font-bold">{detail.bookingId || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-50 pb-3">
                <dt className="font-black uppercase tracking-widest text-slate-400">Cliente (email)</dt>
                <dd className="text-right font-bold">{detail.customerEmail || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-50 pb-3">
                <dt className="font-black uppercase tracking-widest text-slate-400">Staff</dt>
                <dd className="text-right font-bold">{detail.staffMember || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-50 pb-3">
                <dt className="font-black uppercase tracking-widest text-slate-400">Fecha</dt>
                <dd className="font-bold">{new Date(detail.date).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-50 pb-3">
                <dt className="font-black uppercase tracking-widest text-slate-400">Tipo</dt>
                <dd className="font-bold">{detail.type}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-50 pb-3">
                <dt className="font-black uppercase tracking-widest text-slate-400">Estado</dt>
                <dd className="font-bold">{detail.status}</dd>
              </div>
              <div className="flex justify-between gap-4 pt-2">
                <dt className="font-black uppercase tracking-widest text-slate-400">Importe</dt>
                <dd className="text-lg font-black text-primary">${detail.amount.toFixed(2)}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="mt-8 w-full rounded-2xl bg-slate-900 py-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
