"use client";

import React, { useEffect, useMemo, useState } from "react";
import { 
  ArrowDownCircle,
  X,
  Trash2,
  Loader2
} from "lucide-react";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import { formatCurrency, formatDate, formatMerchantNumericId, cn } from "@/lib/utils";
import FilterToolbar from "@/components/admin/FilterToolbar";
import TablePagination from "@/components/admin/TablePagination";
import { OverlayLoader } from "@/components/admin/OverlayLoader";

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    approved: "bg-blue-100 text-blue-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
  };
  const key = (status || "").toLowerCase() as keyof typeof styles;
  const cls = styles[key] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", cls)}>
      {status}
    </span>
  );
};

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [wallet, setWallet] = useState<{ platformBalance: number; totalCommissionRecorded: number; defaultCommission: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [totalPendingAmount, setTotalPendingAmount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const pageSize = 10;

  const reloadWithdrawals = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: searchTerm,
        status: statusFilter,
      });
      const response = await apiGet<{
        data: any[];
        total: number;
        totalPages: number;
        totalPendingAmount: number;
        pendingCount: number;
      }>(`/admin/withdrawals?${query.toString()}`);
      setWithdrawals(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
      setTotalPendingAmount(response.totalPendingAmount || 0);
      setPendingCount(response.pendingCount || 0);
    } catch (err) {
      console.error("Failed to fetch withdrawals", err);
      toastError("Could not load withdrawals", "Refresh the page and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void apiGet<{ platformBalance: number; totalCommissionRecorded: number; defaultCommission: number }>("/admin/wallet")
      .then(setWallet)
      .catch(() => setWallet(null));
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      void reloadWithdrawals();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  async function deleteWithdrawal(id: string) {
    if (!window.confirm("Delete this withdrawal permanently?")) return;
    try {
      const target = withdrawals.find(w => w.id === id);
      await apiDelete(`/admin/withdrawals/${id}`);
      setWithdrawals((prev) => prev.filter((w) => w.id !== id));
      setTotalItems(prev => prev - 1);
      if (target?.status === 'pending') {
        setTotalPendingAmount(prev => Math.max(0, prev - target.amount));
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  }

  async function approveWithdrawal(id: string) {
    if (!window.confirm("Approve this payout request?")) return;
    try {
      const target = withdrawals.find(w => w.id === id);
      setIsLoading(true);
      await apiPost(`/admin/withdrawals/${id}/approve`, {});
      setWithdrawals((prev) => prev.map(w => w.id === id ? { ...w, status: 'approved', processedDate: new Date() } : w));
      if (target?.status === 'pending') {
        setTotalPendingAmount(prev => Math.max(0, prev - target.amount));
      }
      toastSuccess("Withdrawal approved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to approve withdrawal";
      toastError("Approve failed", msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function batchApproveWithdrawals() {
    if (pendingCount === 0) {
      toastError("Nothing to approve", "There are no pending withdrawal requests.");
      return;
    }
    if (
      !window.confirm(
        `Approve all ${pendingCount} pending withdrawal${pendingCount === 1 ? "" : "s"} (${formatCurrency(totalPendingAmount)})?`,
      )
    ) {
      return;
    }
    setBatchProcessing(true);
    try {
      const result = await apiPost<{ approved: number; totalAmount: number }>(
        "/admin/withdrawals/batch-approve",
        {},
      );
      setShowBatchModal(false);
      await reloadWithdrawals();
      toastSuccess(
        "Batch approved",
        `${result.approved} withdrawal${result.approved === 1 ? "" : "s"} (${formatCurrency(result.totalAmount)}) marked as approved.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Batch approval failed";
      toastError("Batch process failed", msg);
    } finally {
      setBatchProcessing(false);
    }
  }

  async function rejectWithdrawal(id: string) {
    if (!window.confirm("Reject this payout request? Funds will be returned to business balance.")) return;
    try {
      const target = withdrawals.find(w => w.id === id);
      setIsLoading(true);
      await apiPost(`/admin/withdrawals/${id}/reject`, {});
      setWithdrawals((prev) => prev.map(w => w.id === id ? { ...w, status: 'rejected', processedDate: new Date() } : w));
      if (target?.status === 'pending') {
        setTotalPendingAmount(prev => Math.max(0, prev - target.amount));
      }
      toastSuccess("Withdrawal rejected");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reject withdrawal";
      toastError("Reject failed", msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Withdrawal Requests</h1>
        <p className="text-slate-500 text-sm mt-1">Review and process payout requests from registered businesses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <ArrowDownCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Platform wallet (commission)</p>
            <h3 className="text-2xl font-black text-slate-900">{formatCurrency(wallet?.platformBalance ?? 0)}</h3>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              {wallet?.defaultCommission ?? 15}% per payment · Recorded: {formatCurrency(wallet?.totalCommissionRecorded ?? 0)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="p-3 bg-blue-50 rounded-2xl">
            <ArrowDownCircle className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Merchant withdrawals pending</p>
            <h3 className="text-2xl font-black text-slate-900">{formatCurrency(totalPendingAmount)}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-2xl">
            <ArrowDownCircle className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Payout queue</p>
            <h3 className="text-lg font-black text-slate-900">Review merchant withdrawal requests below</h3>
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
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Merchant ID</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Business Name</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Current Balance</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Amount Requested</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Processed Date</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 relative">
              {isLoading ? <OverlayLoader /> : null}
              {withdrawals.map((wd, index) => (
                <tr key={wd.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5 text-sm font-semibold text-slate-700">{(page - 1) * pageSize + index + 1}</td>
                  <td className="px-6 py-5 text-sm font-mono text-slate-700">{wd.id}</td>
                  <td className="px-6 py-5 text-sm font-mono tabular-nums tracking-wide text-slate-700">
                    {formatMerchantNumericId(wd.merchantNumber)}
                  </td>
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
                            <button 
                              onClick={() => void approveWithdrawal(wd.id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-md shadow-blue-600/20 active:scale-95"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => void rejectWithdrawal(wd.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition font-black tracking-tighter uppercase text-[10px]"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteWithdrawal(wd.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                              title="Delete Withdrawal"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                       ) : (
                          <span className="text-xs font-bold text-slate-400 italic">Processed on {formatDate(wd.processedDate ?? wd.date)}</span>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-slate-500">
                    No withdrawals match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
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
            <div className="space-y-4 p-6 text-sm text-slate-700">
              <p>
                Approve every <strong>pending</strong> merchant payout in the queue (all pages), not only the rows
                visible on this screen.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Queue summary</p>
                <p className="mt-2 text-lg font-black text-slate-900">
                  {pendingCount} request{pendingCount === 1 ? "" : "s"} · {formatCurrency(totalPendingAmount)}
                </p>
              </div>
              {pendingCount === 0 ? (
                <p className="text-amber-700 font-semibold">No pending withdrawals to process right now.</p>
              ) : null}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                disabled={batchProcessing}
                onClick={() => setShowBatchModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={batchProcessing || pendingCount === 0}
                onClick={() => void batchApproveWithdrawals()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {batchProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
