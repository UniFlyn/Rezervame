"use client";

import React, { useMemo, useState } from "react";
import { 
  ArrowDownCircle,
  X
} from "lucide-react";
import financeData from "@/mock-data/admin-finance.json";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import FilterToolbar from "@/components/admin/FilterToolbar";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showBatchModal, setShowBatchModal] = useState(false);
  const { withdrawals } = financeData;

  const filteredWithdrawals = useMemo(
    () =>
      withdrawals.filter((withdrawal) => {
        const normalized = searchTerm.toLowerCase();
        const matchesSearch =
          withdrawal.id.toLowerCase().includes(normalized) ||
          withdrawal.business.toLowerCase().includes(normalized) ||
          withdrawal.businessId.toLowerCase().includes(normalized);
        const matchesStatus = statusFilter === "all" || withdrawal.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [searchTerm, statusFilter, withdrawals],
  );

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
          <button
            type="button"
            onClick={() => setShowBatchModal(true)}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 active:scale-95"
          >
            Batch Process
          </button>
        </div>
      </div>

      <FilterToolbar
        searchPlaceholder="Search by withdrawal id, business id, or business..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterGroups={[
          {
            key: "withdrawal-status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
            ],
          },
        ]}
      />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">#</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Withdrawal Tx ID</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Business ID</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Business Name</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Current Balance</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Amount Requested</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Processed Date</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredWithdrawals.map((wd, index) => (
                <tr key={wd.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5 text-sm font-semibold text-slate-700">{index + 1}</td>
                  <td className="px-6 py-5 text-sm font-mono text-slate-700">{wd.id}</td>
                  <td className="px-6 py-5 text-sm font-mono text-slate-700">{wd.businessId}</td>
                  <td className="px-6 py-5 text-sm font-semibold text-slate-900">{wd.business}</td>
                  <td className="px-6 py-5 text-center">
                    <p className="text-sm font-bold text-slate-500 italic">{formatCurrency(wd.balance)}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="text-base font-black text-blue-600 font-mono tracking-tighter">{formatCurrency(wd.amount)}</p>
                  </td>
                  <td className="px-6 py-5 text-center text-sm text-slate-600">
                    {wd.processedDate ? formatDate(wd.processedDate) : "-"}
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
                          <span className="text-xs font-bold text-slate-400 italic">Processed on {formatDate(wd.processedDate ?? wd.date)}</span>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-slate-500">
                    No withdrawals match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Batch Process Withdrawals</h2>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-6 text-sm text-slate-700">
              <p>Pending withdrawals in queue: {withdrawals.filter((wd) => wd.status === "pending").length}</p>
              <p>This preview confirms the batch process workflow is now active in UI.</p>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Confirm Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
