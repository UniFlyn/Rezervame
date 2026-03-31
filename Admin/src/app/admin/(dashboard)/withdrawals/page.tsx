"use client";

import React from "react";
import { 
  ArrowDownCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Search,
  Filter
} from "lucide-react";
import financeData from "@/mock-data/admin-finance.json";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    approved: "bg-blue-100 text-blue-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", styles[status as keyof typeof styles])}>
      {status}
    </span>
  );
};

export default function WithdrawalsPage() {
  const { withdrawals } = financeData;

  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Withdrawal Requests</h1>
        <p className="text-slate-500 text-sm mt-1">Review and process payout requests from registered businesses.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-2xl">
            <ArrowDownCircle className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Pending</p>
            <h3 className="text-2xl font-black text-slate-900">$1,500.00</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 active:scale-95">Batch Process</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by business name..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
            />
          </div>
          <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Business Detail</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Current Balance</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Amount Requested</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {withdrawals.map((wd) => (
                <tr key={wd.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-black text-slate-900 text-sm tracking-tight">{wd.business}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{wd.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="text-sm font-bold text-slate-500 italic">{formatCurrency(wd.balance)}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="text-base font-black text-blue-600 font-mono tracking-tighter">{formatCurrency(wd.amount)}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <StatusBadge status={wd.status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {wd.status === 'pending' ? (
                          <>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-md shadow-blue-600/20 active:scale-95">Approve</button>
                            <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition font-black tracking-tighter uppercase text-[10px]">Reject</button>
                          </>
                       ) : (
                          <span className="text-xs font-bold text-slate-400 italic">Processed on {formatDate(wd.date)}</span>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
